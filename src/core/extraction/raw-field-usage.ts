// src/core/extraction/raw-field-usage.ts
// Contract: extraction only. Classification/enrichment happens during normalisation.

import { isObjectRecord, parseJsonString } from "../json";
import type {
	PbixLayout,
	PbixProjectionItem,
	PbixPrototypeSelectItem,
	PbixVisualConfig,
	PbixVisualContainer,
} from "../types";
import {
	PAGE_FILTER_ROLE,
	REPORT_FILTER_ROLE,
	REPORT_SENTINEL_PAGE_INDEX,
	REPORT_SENTINEL_PAGE_NAME,
	REPORT_SENTINEL_VISUAL_ID,
	VISUAL_FILTER_ROLE,
} from "./constants";
import { extractFilterRefs } from "./filter-extraction";

export type RawFieldReference = {
	pageIndex: number;
	pageName: string;
	visualId: string;
	visualType: string;
	visualTitle?: string;
	role: string;
	queryRef: string;
	prototypeSelect?: PrototypeSelectItem[];
	isHiddenVisual?: boolean;
	isHiddenFilter?: boolean;
};

export type PrototypeSelectItem = {
	Name: string;
	kind: "column" | "measure" | "unknown";
};

export type ExtractionContext = {
	reportName: string;
	pageOrder: Map<string, number>;
};

export type ExtractionResult = {
	references: RawFieldReference[];
	context: ExtractionContext;
};

type ProjectionRole = {
	role: string;
	items: PbixProjectionItem[];
};

function resolvePageFilterVisualType(): string {
	return "Page";
}

function resolveReportFilterVisualMetadata(reportName: string): {
	visualType: string;
	visualId: string;
	visualTitle: string | undefined;
} {
	const reportNameOrSentinel = reportName.trim().length > 0 ? reportName : REPORT_SENTINEL_VISUAL_ID;
	if (reportName.trim().length > 0) {
		return {
			visualType: "Report",
			visualId: reportName,
			visualTitle: reportName,
		};
	}

	return {
		visualType: "Report",
		visualId: reportNameOrSentinel,
		visualTitle: undefined,
	};
}

function toPrototypeSelectItem(item: PbixPrototypeSelectItem): PrototypeSelectItem | null {
	if (!item || typeof item.Name !== "string" || item.Name.trim().length === 0) {
		return null;
	}

	const kind: PrototypeSelectItem["kind"] =
		(item as any).Measure ? "measure" :
		(item as any).Aggregation ? "measure" :
		(item as any).Column ? "column" :
		"unknown";

	return { Name: item.Name, kind };
}

/**
 * Parse a visual container config payload into a typed visual config object.
 * @param config Raw config value from the PBIX visual container, as a JSON string or object.
 * @returns A typed visual config object, or null when the payload is missing or invalid JSON.
 */
function parseVisualConfig(config: PbixVisualContainer["config"]): PbixVisualConfig | null {
	if (typeof config === "string") {
		const parsed = parseJsonString<unknown>(config);
		if (!parsed.ok || !isObjectRecord(parsed.value)) {
			return null;
		}
		return parsed.value as PbixVisualConfig;
	}

	if (isObjectRecord(config)) {
		return config as PbixVisualConfig;
	}

	return null;
}

function extractVisualDisplayName(config: PbixVisualConfig): string | undefined {
	const raw = config.singleVisual?.vcObjects?.title?.[0]?.properties?.text?.expr?.Literal?.Value;
	if (typeof raw !== "string") {
		return undefined;
	}
	return raw.replace(/^'+|'+$/g, "");
}

// Strips expression wrappers so Sum(Table.Field) deduplicates to Table.Field.
/**
 * Derive a canonical field identity from a query reference for de-duplication across projection roles.
 * @param queryRef Raw query reference from a projection item, including expression wrappers when present.
 * @returns A `Table.Field` identity string, or null when the query reference cannot be resolved safely.
 */
function fieldIdentityFromQueryRef(queryRef: string): string | null {
	if (queryRef.includes("(")) {
		const match = queryRef.match(/([A-Za-z0-9_]+)\.([A-Za-z0-9_ ]+)/);
		if (!match) {
			return null;
		}
		return `${match[1]}.${match[2]}`;
	}

	if (queryRef.includes(".")) {
		const dotIndex = queryRef.indexOf(".");
		return `${queryRef.substring(0, dotIndex)}.${queryRef.substring(dotIndex + 1)}`;
	}

	return null;
}

/**
 * Emit projection references with role-order propagation for consistent multiplicity across role positions.
 * NOTE: A field found at role index `N` emits references for role indexes `0..N` to preserve pipeline counts.
 * @param projections Projection-role map from the visual config, keyed by role name.
 * @param baseRef Shared visual and page metadata copied into each emitted reference.
 * @param references Mutable accumulator that receives emitted raw field references.
 * @returns Nothing; emitted references are appended to `references`.
 */
function emitPropagatedProjectionRefs(
	projections: Record<string, PbixProjectionItem[] | undefined>,
	baseRef: Omit<RawFieldReference, "role" | "queryRef">,
	references: RawFieldReference[],
): void {
	const projectionRoles: ProjectionRole[] = Object.entries(projections).map(([role, items]) => ({
		role,
		items: items ?? [],
	}));

	// Track first-seen queryRef for each field identity to ensure stable canonical references.
	const canonicalQueryRefByField = new Map<string, string>();

	// Emit field references across all role positions from first occurrence through current role.
	for (const [roleIndex, projectionRole] of projectionRoles.entries()) {
		// Deduplicate fields within each role to prevent duplicate emissions.
		const seenInRole = new Set<string>();

		for (const item of projectionRole.items) {
			const queryRef = item?.queryRef;
			if (!queryRef) {
				continue;
			}

			const fieldIdentity = fieldIdentityFromQueryRef(queryRef);
			if (!fieldIdentity || seenInRole.has(fieldIdentity)) {
				continue;
			}

			seenInRole.add(fieldIdentity);
			// First occurrence wins: lock in the canonical queryRef form for this field.
			if (!canonicalQueryRefByField.has(fieldIdentity)) {
				canonicalQueryRefByField.set(fieldIdentity, queryRef);
			}

			const canonicalQueryRef = canonicalQueryRefByField.get(fieldIdentity);
			if (!canonicalQueryRef) {
				continue;
			}

			// Propagate field reference backward through all role positions up to current.
			for (let emitRoleIndex = 0; emitRoleIndex <= roleIndex; emitRoleIndex += 1) {
				const role = projectionRoles[emitRoleIndex]?.role;
				if (!role) {
					continue;
				}

				references.push({
					...baseRef,
					role,
					queryRef: canonicalQueryRef,
				});
			}
		}
	}
}

/**
 * Extract raw field references from report, page, visual, and filter definitions in a PBIX layout.
 * WARNING: Invalid or partially malformed config/filter JSON is skipped without throwing to keep extraction resilient.
 * @param layout Parsed PBIX layout document containing sections, visuals, projections, and filters.
 * @returns Raw field references plus extraction context containing page ordering metadata.
 */
export function extractRawFieldReferences(layout: PbixLayout, reportName = ""): ExtractionResult {
	const references: RawFieldReference[] = [];
	const pageOrder = new Map<string, number>();

	layout.sections?.forEach((section, sectionIdx) => {
		const pageName = section.displayName ?? "";
		pageOrder.set(pageName, sectionIdx);

		section.visualContainers?.forEach((visual) => {
			const config = parseVisualConfig(visual.config);
			const singleVisual = config?.singleVisual;
			const visualType = singleVisual?.visualType ?? "unknown";
			const visualId = config?.name ?? visual.id;
			const visualTitle = config ? extractVisualDisplayName(config) : undefined;
			const prototypeSelect =
				singleVisual?.prototypeQuery?.Select
					?.map(toPrototypeSelectItem)
					.filter((item): item is PrototypeSelectItem => item !== null) ?? [];
			const isHiddenVisual = singleVisual?.display?.mode === "hidden";

			// Stage 1: Extract field references from visual projections with role propagation.
			if (singleVisual?.projections) {
				emitPropagatedProjectionRefs(
					singleVisual.projections,
					{
						pageIndex: sectionIdx,
						pageName,
						visualType,
						visualId,
						visualTitle,
						prototypeSelect,
						isHiddenVisual: isHiddenVisual || undefined,
					},
					references,
				);
			}

			// Stage 2: Extract visual-level filter references.
			const filterRefs = extractFilterRefs(visual.filters);
			for (const filterRef of filterRefs) {
				references.push({
					pageIndex: sectionIdx,
					pageName,
					visualType,
					visualId,
					visualTitle,
					role: VISUAL_FILTER_ROLE,
					queryRef: filterRef.queryRef,
					prototypeSelect,
					isHiddenFilter: filterRef.hidden || undefined,
				});
			}
		});
		// Stage 3: Extract page-level filter references using a stable page filter type label.
		const pageFilterRefs = extractFilterRefs(section.filters);
		const pageFilterVisualType = resolvePageFilterVisualType();
		for (const filterRef of pageFilterRefs) {
			references.push({
				pageIndex: sectionIdx,
				pageName,
				visualType: pageFilterVisualType,
				visualId: section.name,
				visualTitle: pageName.trim().length > 0 ? pageName : undefined,
				role: PAGE_FILTER_ROLE,
				queryRef: filterRef.queryRef,
				isHiddenFilter: filterRef.hidden || undefined,
			});
		}
	});

	// Stage 4: Extract report-level filter references using report name metadata when available.
	const reportFilterRefs = extractFilterRefs(layout.filters);
	const reportFilterMetadata = resolveReportFilterVisualMetadata(reportName);
	for (const filterRef of reportFilterRefs) {
		references.push({
			pageIndex: REPORT_SENTINEL_PAGE_INDEX,
			pageName: REPORT_SENTINEL_PAGE_NAME,
			visualType: reportFilterMetadata.visualType,
			visualId: reportFilterMetadata.visualId,
			visualTitle: reportFilterMetadata.visualTitle,
			role: REPORT_FILTER_ROLE,
			queryRef: filterRef.queryRef,
			isHiddenFilter: filterRef.hidden || undefined,
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
