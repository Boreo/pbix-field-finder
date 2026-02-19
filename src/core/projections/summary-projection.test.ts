import { describe, expect, it } from "vitest";
import type { CanonicalUsageRow } from "./types";
import { buildSummaryRows } from "./summary-projection";

function makeUsage(overrides: Partial<CanonicalUsageRow> = {}): CanonicalUsageRow {
	return {
		id: "usage-1",
		report: "Report-A",
		page: "Overview",
		pageIndex: 0,
		visualType: "table",
		visualId: "visual-1",
		visualTitle: "Overview Table",
		role: "values",
		table: "Orders",
		field: "Amount",
		kind: "measure",
		isHiddenVisual: false,
		isHiddenFilter: false,
		hiddenUsage: false,
		reportPageKey: "Report-A|Overview",
		reportVisualKey: "Report-A|visual-1",
		searchText: "report-a overview orders amount values table",
		...overrides,
	};
}

describe("buildSummaryRows", () => {
	it("returns an empty array for empty input", () => {
		expect(buildSummaryRows([])).toEqual([]);
	});

	it("groups by table and field and computes distinct report/page/visual counts", () => {
		const rows = buildSummaryRows([
			makeUsage(),
			makeUsage({
				id: "usage-2",
				role: "tooltip",
				reportVisualKey: "Report-A|visual-2",
				visualId: "visual-2",
			}),
			makeUsage({
				id: "usage-3",
				report: "Report-B",
				reportPageKey: "Report-B|Overview",
				reportVisualKey: "Report-B|visual-1",
			}),
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			id: "summary:Orders|Amount",
			table: "Orders",
			field: "Amount",
			totalUses: 3,
			reportCount: 2,
			pageCount: 2,
			visualCount: 3,
			hiddenOnly: false,
			kind: "measure",
			searchText: "orders amount measure",
		});
	});

	it("sorts summary rows by total uses descending, then table and field", () => {
		const rows = buildSummaryRows([
			makeUsage({ id: "a-1", table: "B", field: "Y" }),
			makeUsage({ id: "a-2", table: "A", field: "Z" }),
			makeUsage({ id: "a-3", table: "A", field: "X" }),
			makeUsage({ id: "b-1", table: "A", field: "X" }),
		]);

		expect(rows.map((row) => `${row.table}|${row.field}|${row.totalUses}`)).toEqual([
			"A|X|2",
			"A|Z|1",
			"B|Y|1",
		]);
	});

	it("sorts report breakdown by total uses desc then report name", () => {
		const rows = buildSummaryRows([
			makeUsage({ id: "a-1", report: "Report-B", reportPageKey: "Report-B|P1", reportVisualKey: "Report-B|v1" }),
			makeUsage({ id: "a-2", report: "Report-A", reportPageKey: "Report-A|P1", reportVisualKey: "Report-A|v1" }),
			makeUsage({ id: "a-3", report: "Report-B", reportPageKey: "Report-B|P2", reportVisualKey: "Report-B|v2" }),
			makeUsage({ id: "a-4", report: "Report-A", reportPageKey: "Report-A|P2", reportVisualKey: "Report-A|v2" }),
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0].reports.map((report) => `${report.report}|${report.totalUses}`)).toEqual([
			"Report-A|2",
			"Report-B|2",
		]);
	});

	it("sorts page breakdown by pageIndex then name and keeps minimum pageIndex for same page", () => {
		const rows = buildSummaryRows([
			makeUsage({ id: "u-1", page: "Zeta", pageIndex: 3, reportPageKey: "Report-A|Zeta", reportVisualKey: "Report-A|v1" }),
			makeUsage({ id: "u-2", page: "Alpha", pageIndex: 3, reportPageKey: "Report-A|Alpha", reportVisualKey: "Report-A|v2" }),
			makeUsage({ id: "u-3", page: "Alpha", pageIndex: 1, reportPageKey: "Report-A|Alpha", reportVisualKey: "Report-A|v3" }),
			makeUsage({ id: "u-4", page: "Intro", pageIndex: 0, reportPageKey: "Report-A|Intro", reportVisualKey: "Report-A|v4" }),
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0].reports).toHaveLength(1);
		expect(rows[0].reports[0].pages.map((page) => `${page.page}:${page.pageIndex}:${page.count}:${page.distinctVisuals}`)).toEqual([
			"Intro:0:1:1",
			"Alpha:1:2:2",
			"Zeta:3:1:1",
		]);
	});

	it("marks hiddenOnly true only when all usages are hidden", () => {
		const allHidden = buildSummaryRows([
			makeUsage({ id: "h-1", hiddenUsage: true }),
			makeUsage({ id: "h-2", hiddenUsage: true, reportVisualKey: "Report-A|v2" }),
		]);
		expect(allHidden[0]?.hiddenOnly).toBe(true);

		const mixed = buildSummaryRows([
			makeUsage({ id: "m-1", hiddenUsage: true }),
			makeUsage({ id: "m-2", hiddenUsage: false, reportVisualKey: "Report-A|v2" }),
		]);
		expect(mixed[0]?.hiddenOnly).toBe(false);
	});

	it("uses lexicographic kind tie-break when counts are equal", () => {
		const rows = buildSummaryRows([
			makeUsage({ id: "k-1", kind: "measure" }),
			makeUsage({ id: "k-2", kind: "column", reportVisualKey: "Report-A|v2" }),
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0].kind).toBe("column");
	});
});
