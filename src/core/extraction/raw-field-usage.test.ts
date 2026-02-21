import { describe, expect, it } from "vitest";
import type { PbixLayout } from "../types";
import { readLayoutFixture } from "../../test/fixtures/layoutFixture";
import {
	PAGE_FILTER_ROLE,
	REPORT_FILTER_ROLE,
	REPORT_SENTINEL_PAGE_INDEX,
	REPORT_SENTINEL_PAGE_NAME,
	REPORT_SENTINEL_VISUAL_ID,
	VISUAL_FILTER_ROLE,
} from "./constants";
import { extractRawFieldReferences } from "./raw-field-usage";

describe("extractRawFieldReferences (synthetic fixtures)", () => {
	it("propagates role usage and deduplicates expression wrappers by field identity", () => {
		const layout: PbixLayout = {
			id: 1,
			reportId: 1,
			filters: "[]",
			sections: [
				{
					name: "ReportSection1",
					displayName: "Page 1",
					filters: "[]",
					visualContainers: [
						{
							id: "vc-1",
							filters: "[]",
							config: {
								name: "visual-1",
								singleVisual: {
									visualType: "table",
									projections: {
										X: [{ queryRef: "Sum(Sales.Amount)" }],
										Y: [{ queryRef: "Sales.Amount" }],
									},
								},
							},
						},
					],
				},
			],
		};

		const { references } = extractRawFieldReferences(layout);
		const propagated = references
			.filter((row) => row.visualId === "visual-1")
			.map((row) => `${row.role}:${row.queryRef}`);

		expect(propagated).toEqual([
			"X:Sum(Sales.Amount)",
			"X:Sum(Sales.Amount)",
			"Y:Sum(Sales.Amount)",
		]);
	});

	it("handles malformed config/filter JSON and propagates hidden flags", () => {
		const layout: PbixLayout = {
			id: 2,
			reportId: 2,
			filters: "[]",
			sections: [
				{
					name: "ReportSection1",
					displayName: "Page 1",
					filters: "[]",
					visualContainers: [
						{
							id: "vc-bad",
							config: "{bad-json",
							filters: "{bad-json",
						},
						{
							id: "vc-hidden",
							filters: JSON.stringify([
								{
									isHiddenInViewMode: true,
									expression: {
										Column: {
											Expression: { SourceRef: { Entity: "Sales" } },
											Property: "Amount",
										},
									},
								},
							]),
							config: {
								name: "visual-hidden",
								singleVisual: {
									visualType: "card",
									display: { mode: "hidden" },
									projections: {
										Values: [{ queryRef: "Sales.Amount" }],
									},
								},
							},
						},
					],
				},
			],
		};

		const { references } = extractRawFieldReferences(layout);

		const projectionRef = references.find(
			(row) => row.visualId === "visual-hidden" && row.role === "Values" && row.queryRef === "Sales.Amount",
		);
		expect(projectionRef).toBeDefined();
		expect(projectionRef?.isHiddenVisual).toBe(true);

		const hiddenFilterRef = references.find(
			(row) =>
				row.visualId === "visual-hidden" &&
				row.role === VISUAL_FILTER_ROLE &&
				row.queryRef === "Sales.Amount",
		);
		expect(hiddenFilterRef).toBeDefined();
		expect(hiddenFilterRef?.isHiddenFilter).toBe(true);
	});

	it("uses actual page/report names for filter-only contexts when reportName is available", () => {
		const layout: PbixLayout = {
			id: 3,
			reportId: 3,
			filters: JSON.stringify([
				{
					expression: {
						Column: {
							Expression: { SourceRef: { Entity: "Sales" } },
							Property: "Freight",
						},
					},
				},
			]),
			sections: [
				{
					name: "ReportSection1",
					displayName: "Overview",
					filters: JSON.stringify([
						{
							expression: {
								Column: {
									Expression: { SourceRef: { Entity: "Sales" } },
									Property: "Amount",
								},
							},
						},
					]),
					visualContainers: [],
				},
			],
		};

		const { references } = extractRawFieldReferences(layout, "Sales Report");
		const pageFilter = references.find((row) => row.role === PAGE_FILTER_ROLE && row.queryRef === "Sales.Amount");
		const reportFilter = references.find((row) => row.role === REPORT_FILTER_ROLE && row.queryRef === "Sales.Freight");

		expect(pageFilter?.visualType).toBe("Page");
		expect(pageFilter?.visualTitle).toBe("Overview");
		expect(reportFilter?.pageName).toBe(REPORT_SENTINEL_PAGE_NAME);
		expect(reportFilter?.visualType).toBe("Report");
		expect(reportFilter?.visualId).toBe("Sales Report");
		expect(reportFilter?.visualTitle).toBe("Sales Report");
	});
});

describe("extractRawFieldReferences (data/Layout invariants)", () => {
	it("extracts stable report and aggregation invariants from the fixture layout", () => {
		const layout = readLayoutFixture();
		const { references } = extractRawFieldReferences(layout);

		expect(references.length).toBeGreaterThan(0);

		const reportFilters = references.filter((row) => row.role === REPORT_FILTER_ROLE);
		expect(reportFilters.length).toBeGreaterThan(0);
		expect(
			reportFilters.some(
				(row) =>
					row.pageIndex === REPORT_SENTINEL_PAGE_INDEX &&
					row.visualType === "Report" &&
					row.visualId === REPORT_SENTINEL_VISUAL_ID,
			),
		).toBe(true);
		expect(reportFilters.some((row) => row.queryRef === "Sales.Freight")).toBe(true);

		expect(
			references.some(
				(row) =>
					row.pageName === "P122" &&
					row.role === VISUAL_FILTER_ROLE &&
					/^Sum\(Sales\.(Sales Amount|NSAT)\)$/.test(row.queryRef),
			),
		).toBe(true);
	});
});
