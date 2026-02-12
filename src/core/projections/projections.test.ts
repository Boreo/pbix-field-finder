// src/core/projections/projections.test.ts
import { describe, expect, it } from "vitest";
import type { NormalisedFieldUsage } from "../normalisation/field-normaliser";
import { buildDetailsRows, buildSummaryRows, toCanonicalUsageRows } from "./index";

const normalisedRows: NormalisedFieldUsage[] = [
	{
		report: "Report-A",
		page: "Overview",
		pageIndex: 1,
		visualType: "table",
		visualId: "v1",
		visualTitle: "Sales Table",
		role: "values",
		table: "Orders",
		field: "Amount",
		fieldKind: "measure",
		expression: null,
		isHiddenVisual: false,
		isHiddenFilter: false,
	},
	{
		report: "Report-A",
		page: "Overview",
		pageIndex: 1,
		visualType: "table",
		visualId: "v2",
		visualTitle: "Sales Table",
		role: "tooltip",
		table: "Orders",
		field: "Amount",
		fieldKind: "measure",
		expression: null,
		isHiddenVisual: false,
		isHiddenFilter: false,
	},
	{
		report: "Report-B",
		page: "Detail",
		pageIndex: 0,
		visualType: "chart",
		visualId: "v3",
		visualTitle: "Sales Chart",
		role: "values",
		table: "Orders",
		field: "Amount",
		fieldKind: "measure",
		expression: null,
		isHiddenVisual: true,
		isHiddenFilter: false,
	},
	{
		report: "Report-A",
		page: "Overview",
		pageIndex: 1,
		visualType: "card",
		visualId: "v4",
		visualTitle: "Name Card",
		role: "values",
		table: "Customers",
		field: "Name",
		fieldKind: "column",
		expression: null,
		isHiddenVisual: false,
		isHiddenFilter: true,
	},
];

describe("core projections", () => {
	it("canonical projection normalises blank values and derives search keys", () => {
		const canonical = toCanonicalUsageRows([
			{
				...normalisedRows[0],
				table: " ",
				field: null,
			},
		]);

		expect(canonical).toHaveLength(1);
		expect(canonical[0].table).toBe("(unknown)");
		expect(canonical[0].field).toBe("(unknown)");
		expect(canonical[0].reportPageKey).toBe("Report-A|Overview");
		expect(canonical[0].reportVisualKey).toBe("Report-A|v1");
		expect(canonical[0].searchText).toContain("(unknown)");
	});

	it("summary projection groups and sorts deterministically with hidden-only flags", () => {
		const canonical = toCanonicalUsageRows(normalisedRows);
		const summary = buildSummaryRows(canonical);

		expect(summary).toHaveLength(2);
		expect(summary[0].table).toBe("Orders");
		expect(summary[0].field).toBe("Amount");
		expect(summary[0].totalUses).toBe(3);
		expect(summary[0].reportCount).toBe(2);
		expect(summary[0].pageCount).toBe(2);
		expect(summary[0].visualCount).toBe(3);
		expect(summary[0].hiddenOnly).toBe(false);
		expect(summary[0].reports.map((report) => report.report)).toEqual(["Report-A", "Report-B"]);

		expect(summary[1].table).toBe("Customers");
		expect(summary[1].field).toBe("Name");
		expect(summary[1].hiddenOnly).toBe(true);
	});

	it("orders page breakdown by pageIndex ascending with page-name tiebreak", () => {
		const canonical = toCanonicalUsageRows([
			{
				report: "Report-A",
				page: "Zeta",
				pageIndex: 2,
				visualType: "table",
				visualId: "v1",
				visualTitle: "Zeta Table",
				role: "values",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
			{
				report: "Report-A",
				page: "Alpha",
				pageIndex: 2,
				visualType: "chart",
				visualId: "v2",
				visualTitle: "Alpha Chart",
				role: "values",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
			{
				report: "Report-A",
				page: "Intro",
				pageIndex: 0,
				visualType: "card",
				visualId: "v3",
				visualTitle: "Intro Card",
				role: "values",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
		]);

		const summary = buildSummaryRows(canonical);
		expect(summary).toHaveLength(1);
		expect(summary[0].reports).toHaveLength(1);
		expect(summary[0].reports[0].pages.map((page) => page.page)).toEqual(["Intro", "Alpha", "Zeta"]);
		expect(summary[0].reports[0].pages.map((page) => page.pageIndex)).toEqual([0, 2, 2]);
	});

	it("details projection groups by report/page/field and keeps stable sort order", () => {
		const canonical = toCanonicalUsageRows(normalisedRows);
		const details = buildDetailsRows(canonical);

		expect(details).toHaveLength(3);
		expect(details.map((row) => `${row.report}|${row.page}|${row.table}|${row.field}`)).toEqual([
			"Report-A|Overview|Customers|Name",
			"Report-A|Overview|Orders|Amount",
			"Report-B|Detail|Orders|Amount",
		]);

		expect(details[1].totalUses).toBe(2);
		expect(details[1].distinctVisuals).toBe(2);
		expect(details[1].roles).toEqual(["tooltip", "values"]);
		expect(details[1].hiddenOnly).toBe(false);
		expect(details[2].hiddenOnly).toBe(true);
	});
});
