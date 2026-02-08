// src/core/extraction/raw-field-usage.ts
// Raw field reference extraction from PBIX layout

import type { PbixLayout } from "../types";

/**
 * Raw field ref grabbed straight from the PBIX file.
 */
export type RawFieldReference = {
	// Location metadata
	pageIndex: number;
	pageName: string;
	visualId: string;
	visualType: string;
	visualTitle?: string;

	// Field reference metadata (unparsed)
	role: string;
	queryRef: string;

	// Prototype query metadata (for classification in next stage)
	prototypeSelect?: PrototypeSelectItem[];

	// Display/visibility flags
	isHiddenVisual?: boolean;
	isHiddenFilter?: boolean;
};

/**
 * Prototype query select item for field classification
 */
export type PrototypeSelectItem = {
	Name: string;
	Aggregation?: unknown;
};

/**
 * Context for extraction - tracks page ordering
 */
export type ExtractionContext = {
	reportName: string;
	pageOrder: Map<string, number>;
};

/**
 * Result of raw field extraction
 */
export type ExtractionResult = {
	references: RawFieldReference[];
	context: ExtractionContext;
};

import { extractFilterRefs } from "./filter-extraction";

type ProjectionRole = {
	role: string;
	items: Array<{ queryRef?: string }>;
};

/**
 * Grabs the visual's display name if it's got one.
 */
function extractVisualDisplayName(cfg: any): string | undefined {
	const raw = cfg?.singleVisual?.vcObjects?.title?.[0]?.properties?.text?.expr?.Literal?.Value;

	if (typeof raw === "string") {
		return raw.replace(/^'+|'+$/g, "");
	}

	return undefined;
}

/**
 * Converts a queryRef to a field identity key (Table.Field) used for propagation.
 */
function fieldIdentityFromQueryRef(queryRef: string): string | null {
	if (queryRef.includes("(")) {
		const match = queryRef.match(/([A-Za-z0-9_]+)\.([A-Za-z0-9_ ]+)/);
		if (!match) return null;
		return `${match[1]}.${match[2]}`;
	}

	if (queryRef.includes(".")) {
		const dotIndex = queryRef.indexOf(".");
		return `${queryRef.substring(0, dotIndex)}.${queryRef.substring(dotIndex + 1)}`;
	}

	return null;
}

/**
 * Emits projection references using role-order propagation:
 * each field appearance in role order emits inherited roles up to that role.
 * This preserves multiplicity when the same field appears again later (e.g. via expressions).
 */
function emitPropagatedProjectionRefs(
	projections: Record<string, Array<{ queryRef?: string }>>,
	baseRef: Omit<RawFieldReference, "role" | "queryRef">,
	references: RawFieldReference[],
): void {
	const projectionRoles: ProjectionRole[] = Object.entries(projections).map(([role, items]) => ({
		role,
		items: items ?? [],
	}));

	const canonicalQueryRefByField = new Map<string, string>();

	for (const [roleIndex, projectionRole] of projectionRoles.entries()) {
		const seenInRole = new Set<string>();

		for (const item of projectionRole.items) {
			const queryRef = item?.queryRef;
			if (!queryRef) continue;

			const fieldIdentity = fieldIdentityFromQueryRef(queryRef);
			if (!fieldIdentity || seenInRole.has(fieldIdentity)) continue;

			seenInRole.add(fieldIdentity);

			if (!canonicalQueryRefByField.has(fieldIdentity)) {
				canonicalQueryRefByField.set(fieldIdentity, queryRef);
			}

			const canonicalQueryRef = canonicalQueryRefByField.get(fieldIdentity);
			if (!canonicalQueryRef) continue;

			for (let emitRoleIndex = 0; emitRoleIndex <= roleIndex; emitRoleIndex++) {
				const role = projectionRoles[emitRoleIndex]?.role;
				if (!role) continue;

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
 * Grabs all the raw field refs from the PBIX layout.
 */
export function extractRawFieldReferences(layout: PbixLayout): ExtractionResult {
	const references: RawFieldReference[] = [];
	const pageOrder = new Map<string, number>();

	// Extract field references from all sections (pages)
	layout.sections?.forEach((section, sectionIdx) => {
		const pageName = section.displayName ?? "";
		pageOrder.set(pageName, sectionIdx);

		// Extract from visual containers
		section.visualContainers?.forEach((visual) => {
			const cfg = typeof visual.config === "string" ? JSON.parse(visual.config) : visual.config;

			const sv = cfg?.singleVisual;
			if (!sv?.projections) return;

			// Extract visualType per container
			const visualType = sv.visualType ?? "unknown";
			const visualId = cfg?.name;
			const visualTitle = extractVisualDisplayName(cfg);
			const prototypeSelect = sv.prototypeQuery?.Select ?? [];

			const displayMode = cfg?.singleVisual?.display?.mode;
			const isHiddenVisual = displayMode === "hidden";

			// Extract projections using role-order propagation
			emitPropagatedProjectionRefs(
				sv.projections as Record<string, Array<{ queryRef?: string }>>,
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

			// Extract visual-level filters
			const filterRefs = extractFilterRefs((visual as any).filters);

			for (const f of filterRefs) {
				references.push({
					pageIndex: sectionIdx,
					pageName,
					visualType,
					visualId,
					visualTitle,
					role: "visual-filter",
					queryRef: f.queryRef,
					prototypeSelect,
					isHiddenFilter: f.hidden || undefined,
				});
			}
		});

		// Extract page-level filters
		const pageFilterRefs = extractFilterRefs((section as any).filters);

		for (const f of pageFilterRefs) {
			references.push({
				pageIndex: sectionIdx,
				pageName,
				visualType: "__PAGE__",
				visualId: section.name,
				role: "page-filter",
				queryRef: f.queryRef,
				isHiddenFilter: f.hidden || undefined,
			});
		}
	});

	// Extract report-level filters
	const reportFilterRefs = extractFilterRefs((layout as any).filters);

	for (const f of reportFilterRefs) {
		references.push({
			pageIndex: -1,
			pageName: "Report",
			visualType: "__REPORT__",
			visualId: "__REPORT__",
			role: "report-filter",
			queryRef: f.queryRef,
			isHiddenFilter: f.hidden || undefined,
		});
	}

	return {
		references,
		context: {
			reportName: "", // Will be set in normalisation
			pageOrder,
		},
	};
}
