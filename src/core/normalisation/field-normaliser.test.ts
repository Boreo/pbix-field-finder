import { describe, expect, it } from "vitest";
import type { RawFieldReference } from "../extraction/raw-field-usage";
import {
	PAGE_SENTINEL_VISUAL_TYPE,
	REPORT_SENTINEL_VISUAL_ID,
	REPORT_SENTINEL_VISUAL_TYPE,
} from "../extraction/constants";
import { normaliseFieldReferences } from "./field-normaliser";

describe("normaliseFieldReferences", () => {
	it("keeps expression refs as measures and omits expressionComponents", () => {
		const rawReferences: RawFieldReference[] = [
			{
				pageIndex: 0,
				pageName: "Overview",
				visualId: "visual-1",
				visualType: "card",
				role: "visual-filter",
				queryRef: "Sum(Sales.Amount)",
			},
		];

		const rows = normaliseFieldReferences(rawReferences, {
			reportName: "Sales",
			pageOrder: new Map([["Overview", 0]]),
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]?.fieldKind).toBe("measure");
		expect(rows[0]?.expression).toBe("Sum(Sales.Amount)");
		expect(rows[0]?.table).toBe("Sales");
		expect(rows[0]?.field).toBe("Amount");
		expect(rows[0]).not.toHaveProperty("expressionComponents");
	});

	it("classifies column/context/unknown refs and defaults hidden flags to false", () => {
		const rawReferences: RawFieldReference[] = [
			{
				pageIndex: 0,
				pageName: "Overview",
				visualId: "visual-1",
				visualType: "table",
				role: "values",
				queryRef: "Sales.Amount",
			},
			{
				pageIndex: 0,
				pageName: "Overview",
				visualId: "visual-2",
				visualType: "table",
				role: "values",
				queryRef: ".",
			},
			{
				pageIndex: 0,
				pageName: "Overview",
				visualId: "visual-3",
				visualType: "table",
				role: "values",
				queryRef: "AmountOnly",
			},
		];

		const rows = normaliseFieldReferences(rawReferences, {
			reportName: "Sales",
			pageOrder: new Map([["Overview", 0]]),
		});

		expect(rows).toHaveLength(3);

		expect(rows[0]?.fieldKind).toBe("column");
		expect(rows[0]?.table).toBe("Sales");
		expect(rows[0]?.field).toBe("Amount");
		expect(rows[0]?.isHiddenVisual).toBe(false);
		expect(rows[0]?.isHiddenFilter).toBe(false);
		expect(rows[0]?.pageType).toBe("Default");

		expect(rows[1]?.fieldKind).toBe("context");
		expect(rows[1]?.table).toBeNull();
		expect(rows[1]?.field).toBe(".");

		expect(rows[2]?.fieldKind).toBe("unknown");
		expect(rows[2]?.table).toBeNull();
		expect(rows[2]?.field).toBe("AmountOnly");
	});

	it("respects prototype kind when it disagrees with shape-based inference", () => {
		const rawReferences: RawFieldReference[] = [
			{
				pageIndex: 0,
				pageName: "Overview",
				visualId: "visual-1",
				visualType: "table",
				role: "values",
				queryRef: "Sales.Amount",
				prototypeSelect: [{ Name: "Sales.Amount", kind: "measure" }],
				isHiddenVisual: true,
				isHiddenFilter: true,
			},
		];

		const rows = normaliseFieldReferences(rawReferences, {
			reportName: "Sales",
			pageOrder: new Map([["Overview", 0]]),
		});

		expect(rows).toHaveLength(1);
		expect(rows[0]?.fieldKind).toBe("measure");
		expect(rows[0]?.isHiddenVisual).toBe(true);
		expect(rows[0]?.isHiddenFilter).toBe(true);
	});

	it("replaces sentinel page/report visual metadata with actual names during normalisation", () => {
		const rawReferences: RawFieldReference[] = [
			{
				pageIndex: 0,
				pageName: "Overview",
				visualId: "ReportSection1",
				visualType: PAGE_SENTINEL_VISUAL_TYPE,
				role: "page-filter",
				queryRef: "Sales.Amount",
			},
			{
				pageIndex: -1,
				pageName: "Report",
				visualId: REPORT_SENTINEL_VISUAL_ID,
				visualType: REPORT_SENTINEL_VISUAL_TYPE,
				role: "report-filter",
				queryRef: "Sales.Freight",
			},
		];

		const rows = normaliseFieldReferences(rawReferences, {
			reportName: "Sales Report",
			pageOrder: new Map([["Overview", 0]]),
		});

		expect(rows[0]?.visualType).toBe("Page");
		expect(rows[0]?.visualTitle).toBe("Overview");
		expect(rows[1]?.visualType).toBe("Report");
		expect(rows[1]?.visualId).toBe("Sales Report");
		expect(rows[1]?.visualTitle).toBe("Sales Report");
	});
});
