import { describe, expect, it } from "vitest";
import type { PbixLayout } from "./types";
import { readLayoutFixture } from "../test/fixtures/layoutFixture";
import {
	REPORT_FILTER_ROLE,
	REPORT_SENTINEL_PAGE_INDEX,
	REPORT_SENTINEL_PAGE_NAME,
	REPORT_SENTINEL_VISUAL_TYPE,
} from "./extraction/constants";
import { analyseReport } from "./report-analyser";

describe("analyseReport (synthetic fixture)", () => {
	it("returns raw + normalised rows and stamps report metadata", () => {
		const layout: PbixLayout = {
			id: 1,
			reportId: 10,
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
					filters: "[]",
					visualContainers: [
						{
							id: "vc-1",
							filters: "[]",
							config: {
								name: "visual-1",
								singleVisual: {
									visualType: "card",
									projections: {
										Values: [{ queryRef: "Sum(Sales.Amount)" }],
									},
								},
							},
						},
					],
				},
			],
		};

		const result = analyseReport(layout, "Synthetic Report");

		expect(result.raw.length).toBeGreaterThan(0);
		expect(result.normalised.length).toBe(result.raw.length);
		expect(result.normalised.every((row) => row.report === "Synthetic Report")).toBe(true);
		expect(
			result.normalised.some(
				(row) =>
					row.role === REPORT_FILTER_ROLE &&
					row.page === REPORT_SENTINEL_PAGE_NAME &&
					row.pageIndex === REPORT_SENTINEL_PAGE_INDEX &&
					row.visualType === REPORT_SENTINEL_VISUAL_TYPE &&
					row.table === "Sales" &&
					row.field === "Freight",
			),
		).toBe(true);
	});
});

describe("analyseReport (data/Layout invariants)", () => {
	it("keeps extraction-normalisation parity and measure classification for expression refs", () => {
		const layout = readLayoutFixture();
		const result = analyseReport(layout, "test");

		expect(result.raw.length).toBeGreaterThan(0);
		expect(result.normalised.length).toBe(result.raw.length);

		const expressionPairs = result.raw
			.map((row, index) => ({ raw: row, normalised: result.normalised[index] }))
			.filter((pair) => pair.raw.queryRef.includes("("));
		expect(expressionPairs.length).toBeGreaterThan(0);
		expect(expressionPairs.every((pair) => pair.normalised?.fieldKind === "measure")).toBe(true);

		expect(
			result.normalised.some(
				(row) =>
					row.role === REPORT_FILTER_ROLE &&
					row.page === REPORT_SENTINEL_PAGE_NAME &&
					row.pageIndex === REPORT_SENTINEL_PAGE_INDEX &&
					row.visualType === REPORT_SENTINEL_VISUAL_TYPE,
			),
		).toBe(true);
	});
});
