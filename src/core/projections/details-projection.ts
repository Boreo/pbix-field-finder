// src/core/projections/details-projection.ts
// Groups by report|page|table|field (not visual-level) for per-page breakdown.
import type { FieldKind } from "../extraction/field-classifier";
import type { CanonicalUsageRow, DetailsRow } from "./types";

type DetailsAccumulator = {
	report: string;
	page: string;
	pageIndex: number;
	table: string;
	field: string;
	totalUses: number;
	visuals: Set<string>;
	roles: Set<string>;
	visualTypes: Set<string>;
	hiddenUsageCount: number;
	kindCounts: Map<FieldKind, number>;
};

/**
 * Select the dominant field kind for a details row using deterministic tie-breaking.
 * @param kindCounts Usage counts by field kind within the grouped set.
 * @returns The most frequent kind, or `unknown` when no kind counts are present.
 */
// Lexicographic tie-breaking ensures deterministic kind selection for grouped fields.
function pickKind(kindCounts: Map<FieldKind, number>): FieldKind {
	let bestKind: FieldKind = "unknown";
	let bestCount = -1;

	for (const [kind, count] of kindCounts) {
		if (count > bestCount || (count === bestCount && kind.localeCompare(bestKind) < 0)) {
			bestKind = kind;
			bestCount = count;
		}
	}

	return bestCount === -1 ? "unknown" : bestKind;
}

/**
 * Build detail projection rows grouped by report, page, table, and field.
 * @param usages Canonical usage rows from the projection pipeline.
 * @returns Details rows sorted by report, page index, page, table, and field for stable presentation.
 */
export function buildDetailsRows(usages: CanonicalUsageRow[]): DetailsRow[] {
	const grouped = new Map<string, DetailsAccumulator>();

	for (const usage of usages) {
		const key = `${usage.report}|${usage.page}|${usage.table}|${usage.field}`;
		if (!grouped.has(key)) {
			grouped.set(key, {
				report: usage.report,
				page: usage.page,
				pageIndex: usage.pageIndex,
				table: usage.table,
				field: usage.field,
				totalUses: 0,
				visuals: new Set(),
				roles: new Set(),
				visualTypes: new Set(),
				hiddenUsageCount: 0,
				kindCounts: new Map(),
			});
		}
		const row = grouped.get(key);
		if (!row) continue;
		// Track minimum pageIndex across all usages to handle multi-page field scenarios.
		row.pageIndex = Math.min(row.pageIndex, usage.pageIndex);

		row.totalUses += 1;
		row.visuals.add(usage.reportVisualKey);
		row.roles.add(usage.role);
		row.visualTypes.add(usage.visualType);
		if (usage.hiddenUsage) {
			row.hiddenUsageCount += 1;
		}
		row.kindCounts.set(usage.kind, (row.kindCounts.get(usage.kind) ?? 0) + 1);
	}

	const rows = Array.from(grouped.entries()).map(([key, groupedRow]) => {
		// Convert Sets to sorted arrays for deterministic export and search text generation.
		const roles = Array.from(groupedRow.roles).sort((a, b) => a.localeCompare(b));
		const visualTypes = Array.from(groupedRow.visualTypes).sort((a, b) => a.localeCompare(b));
		const kind = pickKind(groupedRow.kindCounts);
		return {
			id: `details:${key}`,
			report: groupedRow.report,
			page: groupedRow.page,
			pageIndex: groupedRow.pageIndex,
			table: groupedRow.table,
			field: groupedRow.field,
			totalUses: groupedRow.totalUses,
			distinctVisuals: groupedRow.visuals.size,
			roles,
			visualTypes,
			kind,
			hiddenUsageCount: groupedRow.hiddenUsageCount,
			hiddenOnly: groupedRow.totalUses > 0 && groupedRow.hiddenUsageCount === groupedRow.totalUses,
			searchText: `${groupedRow.report} ${groupedRow.page} ${groupedRow.table} ${groupedRow.field} ${roles.join(" ")} ${visualTypes.join(" ")}`.toLowerCase(),
		};
	});

	// Sort details by report, pageIndex, page, table, field for stable output.
	rows.sort((a, b) => {
		if (a.report !== b.report) return a.report.localeCompare(b.report);
		if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
		if (a.page !== b.page) return a.page.localeCompare(b.page);
		if (a.table !== b.table) return a.table.localeCompare(b.table);
		return a.field.localeCompare(b.field);
	});

	return rows;
}
