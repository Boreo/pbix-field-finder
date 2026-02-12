// src/core/projections/summary-projection.ts
// Single-pass accumulator that groups by Table.Field across all reports.
import type { FieldKind } from "../extraction/field-classifier";
import type { CanonicalUsageRow, SummaryReportBreakdown, SummaryRow } from "./types";

type SummaryAccumulator = {
	table: string;
	field: string;
	totalUses: number;
	reports: Set<string>;
	pages: Set<string>;
	visuals: Set<string>;
	hiddenUsageCount: number;
	kindCounts: Map<FieldKind, number>;
	byReport: Map<
		string,
		{
			totalUses: number;
			pages: Set<string>;
			visuals: Set<string>;
			byPage: Map<string, { pageIndex: number; count: number; visuals: Set<string> }>;
		}
	>;
};

/**
 * Select the dominant field kind for a grouped row using deterministic tie-breaking.
 * @param kindCounts Usage counts by field kind within the grouped set.
 * @returns The most frequent kind, or `unknown` when no kind counts are present.
 */
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
 * Convert per-report accumulators into sorted report and page breakdowns.
 * @param byReport Nested report accumulator map keyed by report name.
 * @returns Report breakdown rows sorted by usage count descending, with pages sorted by page index then name.
 */
function toBreakdowns(byReport: SummaryAccumulator["byReport"]): SummaryReportBreakdown[] {
	const reports = Array.from(byReport.entries()).map(([report, data]) => {
		const pages = Array.from(data.byPage.entries())
			.map(([page, pageData]) => ({
				page,
				pageIndex: pageData.pageIndex,
				count: pageData.count,
				distinctVisuals: pageData.visuals.size,
			}))
			.sort((a, b) => {
				if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
				return a.page.localeCompare(b.page);
			});

		return {
			report,
			totalUses: data.totalUses,
			pageCount: data.pages.size,
			visualCount: data.visuals.size,
			pages,
		};
	});

	return reports.sort((a, b) => {
		if (b.totalUses !== a.totalUses) return b.totalUses - a.totalUses;
		return a.report.localeCompare(b.report);
	});
}

/**
 * Build summary projection rows grouped by `table|field` across all canonical usage records.
 * @param usages Canonical usage rows from the projection pipeline.
 * @returns Summary rows sorted by total uses descending, then table and field for deterministic output.
 */
export function buildSummaryRows(usages: CanonicalUsageRow[]): SummaryRow[] {
	const grouped = new Map<string, SummaryAccumulator>();

	for (const usage of usages) {
		const key = `${usage.table}|${usage.field}`;
		if (!grouped.has(key)) {
			grouped.set(key, {
				table: usage.table,
				field: usage.field,
				totalUses: 0,
				reports: new Set(),
				pages: new Set(),
				visuals: new Set(),
				hiddenUsageCount: 0,
				kindCounts: new Map(),
				byReport: new Map(),
			});
		}
		const row = grouped.get(key);
		if (!row) continue;

		row.totalUses += 1;
		row.reports.add(usage.report);
		row.pages.add(usage.reportPageKey);
		row.visuals.add(usage.reportVisualKey);
		if (usage.hiddenUsage) {
			row.hiddenUsageCount += 1;
		}
		row.kindCounts.set(usage.kind, (row.kindCounts.get(usage.kind) ?? 0) + 1);

		if (!row.byReport.has(usage.report)) {
			row.byReport.set(usage.report, {
				totalUses: 0,
				pages: new Set(),
				visuals: new Set(),
				byPage: new Map(),
			});
		}
		const reportData = row.byReport.get(usage.report);
		if (!reportData) continue;

		reportData.totalUses += 1;
		reportData.pages.add(usage.reportPageKey);
		reportData.visuals.add(usage.reportVisualKey);

		if (!reportData.byPage.has(usage.page)) {
			reportData.byPage.set(usage.page, {
				pageIndex: usage.pageIndex,
				count: 0,
				visuals: new Set(),
			});
		}
		const pageData = reportData.byPage.get(usage.page);
		if (!pageData) continue;
		pageData.pageIndex = Math.min(pageData.pageIndex, usage.pageIndex);
		pageData.count += 1;
		pageData.visuals.add(usage.reportVisualKey);
	}

	const rows = Array.from(grouped.entries()).map(([key, groupedRow]) => {
		const kind = pickKind(groupedRow.kindCounts);
		return {
			id: `summary:${key}`,
			table: groupedRow.table,
			field: groupedRow.field,
			totalUses: groupedRow.totalUses,
			reportCount: groupedRow.reports.size,
			pageCount: groupedRow.pages.size,
			visualCount: groupedRow.visuals.size,
			hiddenOnly: groupedRow.totalUses > 0 && groupedRow.hiddenUsageCount === groupedRow.totalUses,
			kind,
			reports: toBreakdowns(groupedRow.byReport),
			searchText: `${groupedRow.table} ${groupedRow.field} ${kind}`.toLowerCase(),
		};
	});

	// Contract: totalUses desc, then table asc, then field asc.
	rows.sort((a, b) => {
		if (b.totalUses !== a.totalUses) return b.totalUses - a.totalUses;
		if (a.table !== b.table) return a.table.localeCompare(b.table);
		return a.field.localeCompare(b.field);
	});

	return rows;
}
