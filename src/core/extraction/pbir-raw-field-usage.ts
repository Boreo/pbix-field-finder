// src/core/extraction/pbir-raw-field-usage.ts
// Extracts RawFieldReference[] from the PBIR directory structure inside a JSZip instance.
// All downstream processing (normalisation, aggregation) works unchanged because the output
// type is identical to the legacy extraction path.

import type JSZip from "jszip";
import type {
	PbirFieldExpr,
	PbirPageJson,
	PbirPagesJson,
	PbirProjection,
	PbirQueryState,
	PbirReportJson,
	PbirVisualJson,
} from "../types/pbir";
import type { PbixProjectionItem } from "../types";
import {
	DRILLTHROUGH_FIELD_ROLE,
	PAGE_FILTER_ROLE,
	REPORT_FILTER_ROLE,
	REPORT_SENTINEL_PAGE_ID,
	REPORT_SENTINEL_PAGE_INDEX,
	REPORT_SENTINEL_PAGE_NAME,
	REPORT_SENTINEL_VISUAL_ID,
	VISUAL_FILTER_ROLE,
} from "./constants";
import { extractPbirFilterRefs } from "./pbir-filter-extraction";
import {
	emitPropagatedProjectionRefs,
	type ExtractionResult,
	type PageType,
	type PrototypeSelectItem,
	type RawFieldReference,
} from "./raw-field-usage";

// ─── File reading helpers ─────────────────────────────────────────────────

/**
 * Read and JSON-parse a file from a JSZip instance.
 * @returns Parsed value, or null when the file is missing or JSON is malformed.
 */
async function readJsonFile<T>(zip: JSZip, path: string): Promise<T | null> {
	const entry = zip.file(path);
	if (!entry) {
		return null;
	}
	try {
		const content = await entry.async("string");
		return JSON.parse(content) as T;
	} catch {
		return null;
	}
}

// ─── Field expression helpers ─────────────────────────────────────────────

/**
 * Derive FieldKind from a PBIR field expression, giving accurate kind without pattern matching.
 */
function pbirFieldExprToKind(
	field: PbirFieldExpr | undefined,
): "column" | "measure" | "unknown" {
	if (!field) return "unknown";
	if (field.Column) return "column";
	if (field.Measure) return "measure";
	if (field.Aggregation) return "measure";
	return "unknown";
}

/**
 * Derive a queryRef string from a PBIR field expression.
 * Handles Column (Entity.Property), Measure (Entity.Property), and Aggregation (Sum(Entity.Property)).
 * Returns null when the expression cannot be resolved.
 */
function fieldExprToQueryRef(field: PbirFieldExpr | undefined): string | null {
	if (!field) return null;

	if (field.Column) {
		const entity = field.Column.Expression?.SourceRef?.Entity;
		const property = field.Column.Property;
		if (!entity || !property) return null;
		return `${entity}.${property}`;
	}

	if (field.Measure) {
		const entity = field.Measure.Expression?.SourceRef?.Entity;
		const property = field.Measure.Property;
		if (!entity || !property) return null;
		return `${entity}.${property}`;
	}

	if (field.Aggregation) {
		const innerQueryRef = fieldExprToQueryRef(field.Aggregation.Expression);
		if (!innerQueryRef) return null;
		return `Sum(${innerQueryRef})`;
	}

	return null;
}

// ─── Visual helpers ───────────────────────────────────────────────────────

/**
 * Extract visual title from PBIR's visualContainerObjects.title path.
 * Strips surrounding single quotes from the Literal value.
 */
function extractPbirVisualTitle(
	visualSection: PbirVisualJson["visual"],
): string | undefined {
	const raw =
		visualSection?.visualContainerObjects?.title?.[0]?.properties?.text?.expr?.Literal
			?.Value;
	if (typeof raw !== "string") {
		return undefined;
	}
	return raw.replace(/^'+|'+$/g, "");
}

/**
 * Build a prototypeSelect array from PBIR queryState projections.
 * Since PBIR provides explicit field types, this gives accurate kind without pattern matching.
 */
function buildPrototypeSelect(queryState: PbirQueryState | undefined): PrototypeSelectItem[] {
	if (!queryState) return [];

	const items: PrototypeSelectItem[] = [];

	for (const roleState of Object.values(queryState)) {
		for (const projection of roleState?.projections ?? []) {
			const queryRef = projection.queryRef;
			if (!queryRef) continue;
			const kind = pbirFieldExprToKind(projection.field);
			items.push({ Name: queryRef, kind });
		}
	}

	return items;
}

/**
 * Convert a PBIR queryState into the PbixProjectionItem record expected by emitPropagatedProjectionRefs.
 * The adapter just picks `queryRef` from each projection since that is the only field the
 * propagation function needs.
 */
function adaptQueryStateToProjectionItems(
	queryState: PbirQueryState,
): Record<string, PbixProjectionItem[] | undefined> {
	const adapted: Record<string, PbixProjectionItem[] | undefined> = {};
	for (const [role, state] of Object.entries(queryState)) {
		adapted[role] = (state?.projections ?? []).map((p: PbirProjection) => ({
			queryRef: p.queryRef,
		}));
	}
	return adapted;
}

// ─── Main extraction function ─────────────────────────────────────────────

/**
 * Extract raw field references from a PBIR-format PBIX zip archive.
 * Produces the same ExtractionResult type as the legacy extractRawFieldReferences(),
 * keeping the entire downstream pipeline (normalisation, aggregation, UI) unchanged.
 *
 * @param zip JSZip instance loaded from the PBIX file.
 * @param reportName Optional report name used for report-filter sentinel labels.
 * @returns Raw field references and extraction context (page ordering).
 */
export async function extractPbirRawFieldReferences(
	zip: JSZip,
	reportName = "",
): Promise<ExtractionResult> {
	const references: RawFieldReference[] = [];
	const pageOrder = new Map<string, number>();

	// Load the pages index to determine display order.
	const pagesJson = await readJsonFile<PbirPagesJson>(
		zip,
		"Report/definition/pages/pages.json",
	);
	const pageIds = pagesJson?.pageOrder ?? [];

	for (const [pageIndex, pageId] of pageIds.entries()) {
		const pageJson = await readJsonFile<PbirPageJson>(
			zip,
			`Report/definition/pages/${pageId}/page.json`,
		);
		if (!pageJson) {
			continue;
		}

		const pageName = pageJson.displayName ?? "";
		pageOrder.set(pageName, pageIndex);

		const pageType: PageType = (pageJson.pageBinding?.type as PageType | undefined) ?? "Default";
		const pageInternalId = pageJson.name ?? pageId;
		const pageVisualId = pageInternalId;
		const pageVisualTitle = pageName.trim().length > 0 ? pageName : undefined;

		// Stage 1: Visual projections and visual-level filters.
		const visualPaths = Object.keys(zip.files).filter((path) => {
			const entry = zip.files[path];
			return (
				!entry?.dir &&
				path.startsWith(`Report/definition/pages/${pageId}/visuals/`) &&
				path.endsWith("/visual.json")
			);
		});

		for (const visualPath of visualPaths) {
			// Use the visual folder name as fallback visual ID.
			const folderMatch = visualPath.match(/visuals\/([^/]+)\/visual\.json$/);
			const visualFolderId = folderMatch?.[1] ?? "";

			const visualJson = await readJsonFile<PbirVisualJson>(zip, visualPath);
			if (!visualJson) {
				continue;
			}

			const visualId = visualJson.name ?? visualFolderId;
			const visualType = visualJson.visual?.visualType ?? "unknown";
			const visualTitle = extractPbirVisualTitle(visualJson.visual);
			const isHiddenVisual = visualJson.isHidden === true ? true : undefined;

			const queryState = visualJson.visual?.query?.queryState;
			const prototypeSelect = buildPrototypeSelect(queryState);

			const baseRef: Omit<RawFieldReference, "role" | "queryRef"> = {
				pageIndex,
				pageId: pageInternalId,
				pageName,
				visualType,
				visualId,
				visualTitle,
				prototypeSelect,
				isHiddenVisual,
				pageType,
			};

			if (queryState) {
				emitPropagatedProjectionRefs(
					adaptQueryStateToProjectionItems(queryState),
					baseRef,
					references,
				);
			}

			// Stage 2: Visual-level filters (filterConfig is at the top level of visual.json).
			const visualFilterRefs = extractPbirFilterRefs(visualJson.filterConfig);
			for (const filterRef of visualFilterRefs) {
				references.push({
					...baseRef,
					role: VISUAL_FILTER_ROLE,
					queryRef: filterRef.queryRef,
					isHiddenFilter: filterRef.hidden || undefined,
				});
			}
		}

		// Stage 3: Page-level filters.
		const pageFilterRefs = extractPbirFilterRefs(pageJson.filterConfig);
		for (const filterRef of pageFilterRefs) {
			references.push({
				pageIndex,
				pageId: pageInternalId,
				pageName,
				visualType: "Page",
				visualId: pageVisualId,
				visualTitle: pageVisualTitle,
				role: PAGE_FILTER_ROLE,
				queryRef: filterRef.queryRef,
				isHiddenFilter: filterRef.hidden || undefined,
				pageType,
			});
		}

		// Stage 4: Drillthrough target fields (PBIR only — stored in pageBinding.parameters).
		if (pageJson.pageBinding?.type === "Drillthrough") {
			for (const param of pageJson.pageBinding.parameters ?? []) {
				if (!param.fieldExpr) {
					continue;
				}
				const queryRef = fieldExprToQueryRef(param.fieldExpr);
				if (!queryRef) {
					continue;
				}
				references.push({
					pageIndex,
					pageId: pageInternalId,
					pageName,
					visualType: "Page",
					visualId: pageVisualId,
					visualTitle: pageVisualTitle,
					role: DRILLTHROUGH_FIELD_ROLE,
					queryRef,
					pageType,
				});
			}
		}
	}

	// Stage 5: Report-level filters.
	const reportJson = await readJsonFile<PbirReportJson>(
		zip,
		"Report/definition/report.json",
	);
	const reportFilterRefs = extractPbirFilterRefs(reportJson?.filterConfig);
	const reportVisualId =
		reportName.trim().length > 0 ? reportName : REPORT_SENTINEL_VISUAL_ID;
	const reportVisualTitle = reportName.trim().length > 0 ? reportName : undefined;
	for (const filterRef of reportFilterRefs) {
		references.push({
			pageIndex: REPORT_SENTINEL_PAGE_INDEX,
			pageId: REPORT_SENTINEL_PAGE_ID,
			pageName: REPORT_SENTINEL_PAGE_NAME,
			visualType: "Report",
			visualId: reportVisualId,
			visualTitle: reportVisualTitle,
			role: REPORT_FILTER_ROLE,
			queryRef: filterRef.queryRef,
			isHiddenFilter: filterRef.hidden || undefined,
			pageType: "Default",
		});
	}

	return {
		references,
		context: {
			reportName,
			pageOrder,
		},
	};
}
