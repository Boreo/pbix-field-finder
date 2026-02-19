import { describe, expect, it } from "vitest";
import type { CanonicalUsageRow } from "./types";
import { buildDetailsRows } from "./details-projection";

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

describe("buildDetailsRows", () => {
	it("returns an empty array for empty input", () => {
		expect(buildDetailsRows([])).toEqual([]);
	});

	it("groups rows by report/page/table/field and aggregates counts", () => {
		const rows = buildDetailsRows([
			makeUsage(),
			makeUsage({
				id: "usage-2",
				role: "tooltip",
				visualType: "card",
				reportVisualKey: "Report-A|visual-2",
				visualId: "visual-2",
			}),
			makeUsage({
				id: "usage-3",
				page: "Detail",
				pageIndex: 1,
				reportPageKey: "Report-A|Detail",
				reportVisualKey: "Report-A|visual-3",
			}),
		]);

		expect(rows).toHaveLength(2);
		expect(rows.find((row) => row.page === "Overview")).toMatchObject({
			id: "details:Report-A|Overview|Orders|Amount",
			totalUses: 2,
			distinctVisuals: 2,
			roles: ["tooltip", "values"],
			visualTypes: ["card", "table"],
			hiddenUsageCount: 0,
			hiddenOnly: false,
			kind: "measure",
			searchText: "report-a overview orders amount tooltip values card table",
		});
	});

	it("sorts rows by report, pageIndex, page, table, and field", () => {
		const rows = buildDetailsRows([
			makeUsage({ id: "s-1", report: "B", page: "Zeta", pageIndex: 2, table: "B", field: "B", reportPageKey: "B|Zeta", reportVisualKey: "B|v1" }),
			makeUsage({ id: "s-2", report: "A", page: "Beta", pageIndex: 2, table: "A", field: "Y", reportPageKey: "A|Beta", reportVisualKey: "A|v1" }),
			makeUsage({ id: "s-3", report: "A", page: "Alpha", pageIndex: 2, table: "A", field: "X", reportPageKey: "A|Alpha", reportVisualKey: "A|v2" }),
			makeUsage({ id: "s-4", report: "A", page: "Intro", pageIndex: 0, table: "C", field: "Z", reportPageKey: "A|Intro", reportVisualKey: "A|v3" }),
		]);

		expect(rows.map((row) => `${row.report}|${row.pageIndex}|${row.page}|${row.table}|${row.field}`)).toEqual([
			"A|0|Intro|C|Z",
			"A|2|Alpha|A|X",
			"A|2|Beta|A|Y",
			"B|2|Zeta|B|B",
		]);
	});

	it("keeps minimum pageIndex when grouped rows disagree on page index", () => {
		const rows = buildDetailsRows([
			makeUsage({ id: "p-1", page: "Overview", pageIndex: 3, reportVisualKey: "Report-A|v1" }),
			makeUsage({ id: "p-2", page: "Overview", pageIndex: 1, reportVisualKey: "Report-A|v2" }),
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0].pageIndex).toBe(1);
	});

	it("marks hiddenOnly and hiddenUsageCount correctly", () => {
		const allHidden = buildDetailsRows([
			makeUsage({ id: "h-1", hiddenUsage: true }),
			makeUsage({ id: "h-2", hiddenUsage: true, reportVisualKey: "Report-A|v2" }),
		]);
		expect(allHidden[0]?.hiddenUsageCount).toBe(2);
		expect(allHidden[0]?.hiddenOnly).toBe(true);

		const mixed = buildDetailsRows([
			makeUsage({ id: "m-1", hiddenUsage: true }),
			makeUsage({ id: "m-2", hiddenUsage: false, reportVisualKey: "Report-A|v2" }),
		]);
		expect(mixed[0]?.hiddenUsageCount).toBe(1);
		expect(mixed[0]?.hiddenOnly).toBe(false);
	});

	it("uses lexicographic kind tie-break when counts are equal", () => {
		const rows = buildDetailsRows([
			makeUsage({ id: "k-1", kind: "measure" }),
			makeUsage({ id: "k-2", kind: "column", reportVisualKey: "Report-A|v2" }),
		]);

		expect(rows).toHaveLength(1);
		expect(rows[0].kind).toBe("column");
	});
});
