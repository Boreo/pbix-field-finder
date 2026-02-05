// src/core/report-analyser.ts

import { normaliseQueryRef } from "./normalise-query-ref";
import type { PbixLayout } from "./types";

// Represents a single instance of a field being used by a visual.
export type VisualFieldUsage = {
	visualId: string;
	pageIndex: number;
	page: string;
	visualType: string;
	visualDisplayName?: string;
	role: string;
	queryRef: string;
	kind: "measure" | "column" | "expression" | "unknown";
	displayMode?: "hidden";
	filterHidden?: boolean;
};

// Normalised, report-wide fact row describing field usage.
export type FieldUsageRow = {
	report: string;
	page: string;
	table: string | null;
	field: string | null;
	expression: string | null;
	visualType: string;
};

//Classifies a query reference as a column, measure, or unknown using the visual's prototype query metadata.
function classifyField(queryRef: string, select: any[]): "measure" | "column" | "expression" | "unknown" {
	if (queryRef === ".") return "unknown"; // "." indicates row/context bindings

	const sel = select.find((s) => s.Name === queryRef);
	if (sel?.Aggregation) return "measure";

	if (queryRef.includes("(")) return "expression";

	if (queryRef.includes(".")) return "column";

	return "unknown";
}

// Extracts a user-friendly display name for a visual from its config, if available, for more readable reporting.
function extractVisualDisplayName(cfg: any): string | undefined {
	const raw = cfg?.singleVisual?.vcObjects?.title?.[0]?.properties?.text?.expr?.Literal?.Value;

	if (typeof raw === "string") {
		return raw.replace(/^'+|'+$/g, "");
	}

	return undefined;
}

//Walks all sections and visuals in a PBIX layout and extracts field usage information.
export function extractVisualFieldUsage(layout: PbixLayout): VisualFieldUsage[] {
	const usage: VisualFieldUsage[] = [];

	layout.sections?.forEach((section, sectionIdx) => {
		section.visualContainers?.forEach((visual) => {
			const cfg = typeof visual.config === "string" ? JSON.parse(visual.config) : visual.config;

			const sv = cfg?.singleVisual;
			if (!sv?.projections) return;

			const select = sv.prototypeQuery?.Select ?? [];
			const visualType = sv.visualType ?? "unknown";
			const displayMode = cfg?.singleVisual?.display?.mode;
			const isHiddenByDisplayMode = displayMode === "hidden";

			// projections
			for (const [role, items] of Object.entries(sv.projections)) {
				for (const item of items as any[]) {
					if (!item.queryRef) continue;

					usage.push({
						pageIndex: sectionIdx,
						page: section.displayName ?? "",
						visualType,
						visualId: cfg?.name,
						visualDisplayName: extractVisualDisplayName(cfg),
						role,
						queryRef: item.queryRef,
						kind: classifyField(item.queryRef, select),
						displayMode: isHiddenByDisplayMode ? "hidden" : undefined,
					});
				}
			}

			// visual-level filters
			const filterRefs = extractFilterRefs((visual as any).filters);

			for (const f of filterRefs) {
				usage.push({
					pageIndex: sectionIdx,
					page: section.displayName ?? "",
					visualType,
					visualId: cfg?.name,
					visualDisplayName: extractVisualDisplayName(cfg),
					role: "visual-filter",
					queryRef: f.queryRef,
					kind: classifyField(f.queryRef, select),
					filterHidden: f.hidden,
				});
			}
		});
		// page-level filters
		const pageFilterRefs = extractFilterRefs((section as any).filters);

		for (const f of pageFilterRefs) {
			usage.push({
				pageIndex: sectionIdx,
				page: section.displayName ?? "",
				visualType: "__PAGE__",
				visualId: section.name,
				visualDisplayName: undefined,
				role: "page-filter",
				queryRef: f.queryRef,
				kind: "unknown",
				filterHidden: f.hidden,
			});
		}
	});

	// report-level filters
	const reportFilterRefs = extractFilterRefs((layout as any).filters);

	for (const f of reportFilterRefs) {
		usage.push({
			pageIndex: -1,
			page: "Report",
			visualType: "__REPORT__",
			visualId: "__REPORT__",
			visualDisplayName: undefined,
			role: "report-filter",
			queryRef: f.queryRef,
			kind: "unknown",
			filterHidden: f.hidden,
		});
	}

	return usage;
}

//Converts event-level visual field usage into a normalised fact table for grouping, totals, and export.
export function buildFieldUsageTable(usage: VisualFieldUsage[], reportName: string): FieldUsageRow[] {
	return usage.map((u) => {
		const norm = normaliseQueryRef(u.queryRef);

		return {
			report: reportName,
			page: u.page,
			table: norm.table,
			field: norm.field,
			expression: norm.expression,
			visualType: u.visualType,
		};
	});
}

type FilterRef = {
	queryRef: string;
	hidden: boolean;
};

// Parses the visual or page filters to extract query references
function extractFilterRefs(filters: unknown): FilterRef[] {
	if (typeof filters !== "string") return [];

	try {
		const parsed = JSON.parse(filters);
		if (!Array.isArray(parsed)) return [];

		const refs: FilterRef[] = [];

		for (const f of parsed) {
			const expr = f?.expression;
			if (!expr) continue;

			const hidden = f?.isHiddenInViewMode === true;

			// Column filter
			if (expr.Column?.Property && expr.Column?.Expression?.SourceRef?.Entity) {
				refs.push({
					queryRef: `${expr.Column.Expression.SourceRef.Entity}.${expr.Column.Property}`,
					hidden,
				});
			}

			// Aggregation / measure-like filter
			if (
				expr.Aggregation?.Expression?.Column?.Property &&
				expr.Aggregation?.Expression?.Column?.Expression?.SourceRef?.Entity
			) {
				refs.push({
					queryRef: `Sum(${expr.Aggregation.Expression.Column.Expression.SourceRef.Entity}.${expr.Aggregation.Expression.Column.Property})`,
					hidden,
				});
			}
		}

		return refs;
	} catch {
		return [];
	}
}
