// src/ui/features/results/useBreakdownRows.ts
import { useMemo } from "react";
import type { CanonicalUsageRow, SummaryRow } from "@/core/projections";

export type PageBreakdownRow = {
	report: string;
	page: string;
	pageIndex: number;
	pageType: string;
	uses: number;
	visuals: number;
};

export type VisualBreakdownRow = {
	report: string;
	page: string;
	pageIndex: number;
	visualDisplayName: string;
	visualType: string;
	visualId: string;
	rawType: string;
	roles: string[];
	hidden: boolean;
};

function toFriendlyVisualType(rawType: string): string {
	const mapping: Record<string, string> = {
		pivotTable: "Table",
		tableEx: "Table",
		clusteredColumnChart: "Column Chart",
		lineChart: "Line Chart",
		pieChart: "Pie Chart",
		donutChart: "Donut Chart",
		card: "Card",
		multiRowCard: "Card",
		slicer: "Slicer",
		map: "Map",
		shape: "Shape",
		textbox: "Text Box",
	};
	return mapping[rawType] ?? rawType;
}

function pickPageType(pageTypes: Set<string> | undefined): string {
	if (!pageTypes || pageTypes.size === 0) {
		return "Default";
	}

	if (pageTypes.has("Drillthrough")) {
		return "Drillthrough";
	}
	if (pageTypes.has("Tooltip")) {
		return "Tooltip";
	}
	if (pageTypes.has("Parameters")) {
		return "Parameters";
	}
	if (pageTypes.has("Default")) {
		return "Default";
	}

	return Array.from(pageTypes).sort((a, b) => a.localeCompare(b))[0] ?? "Default";
}

function computeVisualDisplayNames(
	canonicalUsages: CanonicalUsageRow[],
	report: string,
	page: string,
): Map<string, string> {
	const visualsOnPage = new Map<
		string,
		{
			visualType: string;
			visualTitle: string;
			pageIndex: number;
		}
	>();

	for (const usage of canonicalUsages) {
		if (usage.report === report && usage.page === page) {
			if (!visualsOnPage.has(usage.visualId)) {
				visualsOnPage.set(usage.visualId, {
					visualType: usage.visualType,
					visualTitle: usage.visualTitle,
					pageIndex: usage.pageIndex,
				});
			}
		}
	}

	const sorted = Array.from(visualsOnPage.entries()).sort((a, b) => {
		const aData = a[1];
		const bData = b[1];
		if (aData.pageIndex !== bData.pageIndex) {
			return aData.pageIndex - bData.pageIndex;
		}
		return a[0].localeCompare(b[0]);
	});

	const displayNames = new Map<string, string>();
	const typeCounts = new Map<string, number>();

	for (const [visualId, data] of sorted) {
		if (data.visualTitle && data.visualTitle.trim().length > 0) {
			displayNames.set(visualId, data.visualTitle);
		} else {
			const friendlyType = toFriendlyVisualType(data.visualType);
			const ordinal = (typeCounts.get(friendlyType) ?? 0) + 1;
			typeCounts.set(friendlyType, ordinal);
			displayNames.set(visualId, `${friendlyType} (${ordinal})`);
		}
	}

	return displayNames;
}

/**
 * Build report breakdown rows and filtered row sets for the active query.
 */
export function useBreakdownRows({
	summaryRow,
	allCanonicalUsages,
	singleReportMode,
	query,
}: {
	summaryRow: SummaryRow;
	allCanonicalUsages: CanonicalUsageRow[];
	singleReportMode: boolean;
	query: string;
}) {
	const pageRows = useMemo<PageBreakdownRow[]>(() => {
		const rows: PageBreakdownRow[] = [];
		const pageTypesByKey = new Map<string, Set<string>>();
		const fieldUsages = allCanonicalUsages.filter(
			(usage) => usage.table === summaryRow.table && usage.field === summaryRow.field,
		);

		for (const usage of fieldUsages) {
			const key = `${usage.report}|${usage.pageIndex}|${usage.page}`;
			if (!pageTypesByKey.has(key)) {
				pageTypesByKey.set(key, new Set());
			}
			pageTypesByKey.get(key)?.add(usage.pageType ?? "Default");
		}

		for (const report of summaryRow.reports) {
			for (const page of report.pages) {
				const key = `${report.report}|${page.pageIndex}|${page.page}`;
				rows.push({
					report: report.report,
					page: page.page,
					pageIndex: page.pageIndex,
					pageType: pickPageType(pageTypesByKey.get(key)),
					uses: page.count,
					visuals: page.distinctVisuals,
				});
			}
		}

		rows.sort((a, b) => {
			if (a.report !== b.report) return a.report.localeCompare(b.report);
			return a.pageIndex - b.pageIndex;
		});

		return rows;
	}, [allCanonicalUsages, summaryRow.field, summaryRow.reports, summaryRow.table]);

	const visualRows = useMemo<VisualBreakdownRow[]>(() => {
		const fieldUsages = allCanonicalUsages.filter(
			(usage) => usage.table === summaryRow.table && usage.field === summaryRow.field,
		);

		const grouped = new Map<
			string,
			Map<
				string,
				Map<
					string,
					{
						visualType: string;
						pageIndex: number;
						roles: Set<string>;
						isHiddenVisual: boolean;
						isHiddenFilter: boolean;
					}
				>
			>
		>();

		for (const usage of fieldUsages) {
			if (!grouped.has(usage.report)) {
				grouped.set(usage.report, new Map());
			}
			const reportMap = grouped.get(usage.report)!;

			if (!reportMap.has(usage.page)) {
				reportMap.set(usage.page, new Map());
			}
			const pageMap = reportMap.get(usage.page)!;

			if (!pageMap.has(usage.visualId)) {
				pageMap.set(usage.visualId, {
					visualType: usage.visualType,
					pageIndex: usage.pageIndex,
					roles: new Set(),
					isHiddenVisual: usage.isHiddenVisual,
					isHiddenFilter: usage.isHiddenFilter,
				});
			}

			const visual = pageMap.get(usage.visualId)!;
			visual.roles.add(usage.role);
		}

		const rows: VisualBreakdownRow[] = [];
		for (const [report, pageMap] of grouped) {
			for (const [page, visualMap] of pageMap) {
				const displayNames = computeVisualDisplayNames(allCanonicalUsages, report, page);
				for (const [visualId, data] of visualMap) {
					rows.push({
						report,
						page,
						pageIndex: data.pageIndex,
						visualDisplayName: displayNames.get(visualId) ?? "Untitled Visual",
						visualType: toFriendlyVisualType(data.visualType),
						visualId,
						rawType: data.visualType,
						roles: Array.from(data.roles).sort(),
						hidden: data.isHiddenVisual || data.isHiddenFilter,
					});
				}
			}
		}

		return rows;
	}, [allCanonicalUsages, summaryRow.table, summaryRow.field]);

	const filteredPageRows = useMemo(() => {
		if (!query.trim()) return pageRows;
		const needle = query.toLowerCase();
		return pageRows.filter((row) => {
			return (
				row.page.toLowerCase().includes(needle) ||
				row.pageType.toLowerCase().includes(needle) ||
				(!singleReportMode && row.report.toLowerCase().includes(needle))
			);
		});
	}, [pageRows, query, singleReportMode]);

	const filteredVisualRows = useMemo(() => {
		if (!query.trim()) return visualRows;
		const needle = query.toLowerCase();
		return visualRows.filter((row) => {
			const hiddenLabel = row.hidden ? "yes" : "";
			return (
				row.page.toLowerCase().includes(needle) ||
				row.visualDisplayName.toLowerCase().includes(needle) ||
				row.visualType.toLowerCase().includes(needle) ||
				row.rawType.toLowerCase().includes(needle) ||
				row.roles.some((role) => role.toLowerCase().includes(needle)) ||
				hiddenLabel.includes(needle) ||
				(!singleReportMode && row.report.toLowerCase().includes(needle))
			);
		});
	}, [visualRows, query, singleReportMode]);

	return {
		pageRows,
		visualRows,
		filteredPageRows,
		filteredVisualRows,
	};
}

