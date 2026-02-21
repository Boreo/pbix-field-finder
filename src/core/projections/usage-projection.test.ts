import { describe, expect, it } from "vitest";
import type { NormalisedFieldUsage } from "../normalisation/field-normaliser";
import { toCanonicalUsageRows } from "./usage-projection";

describe("toCanonicalUsageRows", () => {
	it("normalizes blank table and field values to (unknown)", () => {
		const rows: NormalisedFieldUsage[] = [
			{
				report: "Sales",
				page: "Overview",
				pageIndex: 0,
				visualType: "table",
				visualId: "v1",
				visualTitle: "Title",
				role: "values",
				table: " ",
				field: null,
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
		];

		const canonical = toCanonicalUsageRows(rows);
		expect(canonical[0]?.table).toBe("(unknown)");
		expect(canonical[0]?.field).toBe("(unknown)");
		expect(canonical[0]?.pageType).toBe("Default");
	});

	it("derives hiddenUsage from visual/filter hidden flags", () => {
		const canonical = toCanonicalUsageRows([
			{
				report: "Sales",
				page: "Overview",
				pageIndex: 0,
				visualType: "table",
				visualId: "v1",
				visualTitle: "",
				role: "values",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: true,
				isHiddenFilter: false,
			},
			{
				report: "Sales",
				page: "Overview",
				pageIndex: 0,
				visualType: "table",
				visualId: "v2",
				visualTitle: "",
				role: "values",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: true,
			},
		]);

		expect(canonical[0]?.hiddenUsage).toBe(true);
		expect(canonical[1]?.hiddenUsage).toBe(true);
	});

	it("creates deterministic ids with index suffix and key fields", () => {
		const rows: NormalisedFieldUsage[] = [
			{
				report: "Sales",
				page: "Overview",
				pageIndex: 0,
				visualType: "table",
				visualId: "v1",
				visualTitle: "",
				role: "values",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
			{
				report: "Sales",
				page: "Overview",
				pageIndex: 0,
				visualType: "table",
				visualId: "v1",
				visualTitle: "",
				role: "values",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
		];

		const canonical = toCanonicalUsageRows(rows);
		expect(canonical[0]?.id).toBe("Sales|Overview|v1|values|Orders|Amount|0");
		expect(canonical[1]?.id).toBe("Sales|Overview|v1|values|Orders|Amount|1");
	});

	it("builds report/page keys and lowercase search text", () => {
		const canonical = toCanonicalUsageRows([
			{
				report: "Sales Team",
				page: "OVERVIEW",
				pageIndex: 0,
				visualType: "TABLE",
				visualId: "v1",
				visualTitle: "TOTALS",
				role: "VALUES",
				table: "Orders",
				field: "Amount",
				fieldKind: "measure",
				expression: null,
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
		]);

		expect(canonical[0]?.reportPageKey).toBe("Sales Team|OVERVIEW");
		expect(canonical[0]?.reportVisualKey).toBe("Sales Team|v1");
		expect(canonical[0]?.searchText).toBe(canonical[0]?.searchText.toLowerCase());
		expect(canonical[0]?.searchText).toContain("totals");
	});
});
