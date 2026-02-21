// src/ui/features/results/useBreakdownRows.test.ts
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CanonicalUsageRow, SummaryRow } from "@/core/projections";
import { useBreakdownRows } from "./useBreakdownRows";

function makeCanonicalUsageRow({
	id,
	report,
	table,
	field,
	page,
	pageIndex,
	visualType,
	visualId,
	role,
	visualTitle = "",
	isHiddenVisual = false,
	isHiddenFilter = false,
}: {
	id: string;
	report: string;
	table: string;
	field: string;
	page: string;
	pageIndex: number;
	visualType: string;
	visualId: string;
	role: string;
	visualTitle?: string;
	isHiddenVisual?: boolean;
	isHiddenFilter?: boolean;
}): CanonicalUsageRow {
	return {
		id,
		report,
		page,
		pageIndex,
		visualType,
		visualId,
		visualTitle,
		role,
		table,
		field,
		kind: "measure",
		isHiddenVisual,
		isHiddenFilter,
		hiddenUsage: isHiddenVisual || isHiddenFilter,
		reportPageKey: `${report}|${page}`,
		reportVisualKey: `${report}|${visualId}`,
		searchText: `${report} ${page} ${table} ${field} ${role}`.toLowerCase(),
	};
}

const summaryRow: SummaryRow = {
	id: "summary:Orders|Amount",
	table: "Orders",
	field: "Amount",
	totalUses: 4,
	reportCount: 2,
	pageCount: 3,
	visualCount: 3,
	hiddenOnly: false,
	kind: "measure",
	reports: [
		{
			report: "BReport",
			totalUses: 2,
			pageCount: 2,
			visualCount: 2,
			pages: [
				{ page: "P2", pageIndex: 2, count: 1, distinctVisuals: 1 },
				{ page: "P1", pageIndex: 1, count: 1, distinctVisuals: 1 },
			],
		},
		{
			report: "AReport",
			totalUses: 2,
			pageCount: 1,
			visualCount: 2,
			pages: [{ page: "Intro", pageIndex: 0, count: 2, distinctVisuals: 2 }],
		},
	],
	searchText: "orders amount measure",
};

const canonicalUsages: CanonicalUsageRow[] = [
	makeCanonicalUsageRow({
		id: "a:v1:values",
		report: "AReport",
		table: "Orders",
		field: "Amount",
		page: "Intro",
		pageIndex: 0,
		visualType: "tableEx",
		visualId: "v1",
		role: "Values",
		isHiddenVisual: true,
	}),
	makeCanonicalUsageRow({
		id: "a:v1:category",
		report: "AReport",
		table: "Orders",
		field: "Amount",
		page: "Intro",
		pageIndex: 0,
		visualType: "tableEx",
		visualId: "v1",
		role: "Category",
		isHiddenVisual: true,
	}),
	makeCanonicalUsageRow({
		id: "a:v2:values",
		report: "AReport",
		table: "Orders",
		field: "Amount",
		page: "Intro",
		pageIndex: 0,
		visualType: "tableEx",
		visualId: "v2",
		role: "Values",
	}),
	makeCanonicalUsageRow({
		id: "b:v3:x",
		report: "BReport",
		table: "Orders",
		field: "Amount",
		page: "P1",
		pageIndex: 1,
		visualType: "lineChart",
		visualId: "v3",
		role: "X",
		visualTitle: "Trend",
	}),
	makeCanonicalUsageRow({
		id: "other-field",
		report: "AReport",
		table: "Orders",
		field: "OtherField",
		page: "Intro",
		pageIndex: 0,
		visualType: "card",
		visualId: "v9",
		role: "Values",
	}),
];

describe("useBreakdownRows", () => {
	it("builds stable page rows sorted by report and page index", () => {
		const { result } = renderHook(() =>
			useBreakdownRows({
				summaryRow,
				allCanonicalUsages: canonicalUsages,
				singleReportMode: false,
				query: "",
			}),
		);

		expect(result.current.pageRows.map((row) => `${row.report}:${row.page}`)).toEqual([
			"AReport:Intro",
			"BReport:P1",
			"BReport:P2",
		]);
	});

	it("groups visual rows by visual id, computes hidden state, and applies fallback names", () => {
		const { result } = renderHook(() =>
			useBreakdownRows({
				summaryRow,
				allCanonicalUsages: canonicalUsages,
				singleReportMode: false,
				query: "",
			}),
		);

		expect(result.current.visualRows).toHaveLength(3);

		const v1 = result.current.visualRows.find((row) => row.visualId === "v1");
		const v2 = result.current.visualRows.find((row) => row.visualId === "v2");
		const v3 = result.current.visualRows.find((row) => row.visualId === "v3");

		expect(v1).toBeDefined();
		expect(v1?.roles).toEqual(["Category", "Values"]);
		expect(v1?.hidden).toBe(true);
		expect(v1?.visualDisplayName).toBe("Table (1)");

		expect(v2?.visualDisplayName).toBe("Table (2)");
		expect(v3?.visualDisplayName).toBe("Trend");
	});

	it("filters by query and respects single-report mode report matching rules", () => {
		const { result, rerender } = renderHook(
			({ query, singleReportMode }) =>
				useBreakdownRows({
					summaryRow,
					allCanonicalUsages: canonicalUsages,
					singleReportMode,
					query,
				}),
			{
				initialProps: { query: "yes", singleReportMode: false },
			},
		);

		expect(result.current.filteredVisualRows.map((row) => row.visualId)).toEqual(["v1"]);

		rerender({ query: "areport", singleReportMode: false });
		expect(result.current.filteredPageRows).toHaveLength(1);
		expect(result.current.filteredVisualRows).toHaveLength(2);

		rerender({ query: "areport", singleReportMode: true });
		expect(result.current.filteredPageRows).toHaveLength(0);
		expect(result.current.filteredVisualRows).toHaveLength(0);
	});
});

