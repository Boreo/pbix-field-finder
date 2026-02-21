// src/core/extraction/pbir-raw-field-usage.test.ts

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createMockPbirFile } from "../../test/fixtures/mockPbixFile";
import { extractPbirRawFieldReferences } from "./pbir-raw-field-usage";

// ─── Helpers for building minimal PBIR zip instances ───────────────────────

async function makePbirZip(
	pages: Array<{ id: string; page: object; visuals?: Array<{ id: string; visual: object }> }>,
	report: object = {},
) {
	const { default: JSZip } = await import("jszip");
	const zip = new JSZip();

	const pageIds = pages.map((p) => p.id);
	zip.file(
		"Report/definition/pages/pages.json",
		JSON.stringify({ pageOrder: pageIds }),
	);
	zip.file("Report/definition/report.json", JSON.stringify(report));

	for (const page of pages) {
		zip.file(
			`Report/definition/pages/${page.id}/page.json`,
			JSON.stringify(page.page),
		);
		for (const visual of page.visuals ?? []) {
			zip.file(
				`Report/definition/pages/${page.id}/visuals/${visual.id}/visual.json`,
				JSON.stringify(visual.visual),
			);
		}
	}

	return zip;
}

// ─── Page metadata extraction ─────────────────────────────────────────────

describe("page metadata", () => {
	it("extracts pages in pageOrder sequence with correct pageIndex", async () => {
		const zip = await makePbirZip([
			{ id: "PageA", page: { displayName: "Alpha", pageBinding: { type: "Default" } } },
			{ id: "PageB", page: { displayName: "Beta", pageBinding: { type: "Default" } } },
		]);

		const result = await extractPbirRawFieldReferences(zip);

		expect(result.context.pageOrder.get("Alpha")).toBe(0);
		expect(result.context.pageOrder.get("Beta")).toBe(1);
	});

	it("uses empty string as pageName when displayName is absent", async () => {
		const zip = await makePbirZip([
			{
				id: "PageA",
				page: { pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "card",
								query: { queryState: { Values: { projections: [{ queryRef: "Sales.Amount" }] } } },
							},
						},
					},
				],
			},
		]);

		const result = await extractPbirRawFieldReferences(zip);
		expect(result.references[0]?.pageName).toBe("");
	});

	it("sets pageType from pageBinding.type", async () => {
		const zip = await makePbirZip([
			{
				id: "DT",
				page: {
					displayName: "Detail",
					pageBinding: {
						type: "Drillthrough",
						parameters: [],
					},
				},
			},
		]);

		const result = await extractPbirRawFieldReferences(zip);
		// No visual refs here, but page order is still recorded
		expect(result.context.pageOrder.get("Detail")).toBe(0);
	});

	it("stores reportName in context", async () => {
		const zip = await makePbirZip([]);
		const result = await extractPbirRawFieldReferences(zip, "My Report");
		expect(result.context.reportName).toBe("My Report");
	});
});

// ─── Visual projection extraction ────────────────────────────────────────

describe("visual projection extraction", () => {
	it("emits a reference for a Column projection", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "card",
								query: {
									queryState: {
										Values: {
											projections: [
												{
													field: {
														Column: {
															Expression: { SourceRef: { Entity: "Sales" } },
															Property: "Amount",
														},
													},
													queryRef: "Sales.Amount",
												},
											],
										},
									},
								},
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const ref = references.find((r) => r.queryRef === "Sales.Amount");
		expect(ref).toBeDefined();
		expect(ref?.pageName).toBe("P1");
		expect(ref?.pageIndex).toBe(0);
		expect(ref?.visualType).toBe("card");
		expect(ref?.visualId).toBe("V1");
		expect(ref?.role).toBe("Values");
		expect(ref?.pageType).toBe("Default");
	});

	it("emits a reference for an Aggregation projection with correct queryRef", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "areaChart",
								query: {
									queryState: {
										Y: {
											projections: [
												{
													field: {
														Aggregation: {
															Expression: {
																Column: {
																	Expression: { SourceRef: { Entity: "Sales" } },
																	Property: "SalesAmount",
																},
															},
															Function: 0,
														},
													},
													queryRef: "Sum(Sales.SalesAmount)",
												},
											],
										},
									},
								},
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const ref = references.find((r) => r.queryRef === "Sum(Sales.SalesAmount)");
		expect(ref).toBeDefined();
		expect(ref?.role).toBe("Y");
	});

	it("derives prototypeSelect kind=column for Column projections", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "card",
								query: {
									queryState: {
										Values: {
											projections: [
												{
													field: { Column: { Expression: { SourceRef: { Entity: "Sales" } }, Property: "Amount" } },
													queryRef: "Sales.Amount",
												},
											],
										},
									},
								},
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const ref = references.find((r) => r.queryRef === "Sales.Amount");
		expect(ref?.prototypeSelect).toContainEqual({ Name: "Sales.Amount", kind: "column" });
	});

	it("derives prototypeSelect kind=measure for Aggregation projections", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "kpi",
								query: {
									queryState: {
										Indicator: {
											projections: [
												{
													field: {
														Aggregation: {
															Expression: { Column: { Expression: { SourceRef: { Entity: "Sales" } }, Property: "Revenue" } },
															Function: 0,
														},
													},
													queryRef: "Sum(Sales.Revenue)",
												},
											],
										},
									},
								},
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const ref = references.find((r) => r.queryRef === "Sum(Sales.Revenue)");
		expect(ref?.prototypeSelect).toContainEqual({ Name: "Sum(Sales.Revenue)", kind: "measure" });
	});

	it("uses visual.name as visualId", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "folder-id",
						visual: {
							name: "stable-name-123",
							visual: {
								visualType: "card",
								query: { queryState: { Values: { projections: [{ queryRef: "Sales.Amount" }] } } },
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references[0]?.visualId).toBe("stable-name-123");
	});

	it("falls back to folder name as visualId when visual.name is absent", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "folder-id",
						visual: {
							visual: {
								visualType: "card",
								query: { queryState: { Values: { projections: [{ queryRef: "Sales.Amount" }] } } },
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references[0]?.visualId).toBe("folder-id");
	});

	it("extracts visual title from visualContainerObjects.title", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "card",
								query: { queryState: { Values: { projections: [{ queryRef: "Sales.Amount" }] } } },
								visualContainerObjects: {
									title: [
										{ properties: { text: { expr: { Literal: { Value: "'My Card Title'" } } } } },
									],
								},
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references[0]?.visualTitle).toBe("My Card Title");
	});

	it("sets isHiddenVisual when top-level isHidden is true", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							isHidden: true,
							visual: {
								visualType: "card",
								query: { queryState: { Values: { projections: [{ queryRef: "Sales.Amount" }] } } },
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references[0]?.isHiddenVisual).toBe(true);
	});

	it("skips visuals with no queryState", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: { visualType: "basicShape" },
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references.filter((r) => r.role !== "visual-filter" && r.role !== "page-filter" && r.role !== "report-filter")).toHaveLength(0);
	});

	it("skips projections without queryRef", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "card",
								query: {
									queryState: { Values: { projections: [{ field: {} }] } },
								},
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references.filter((r) => r.visualId === "V1" && r.role === "Values")).toHaveLength(0);
	});
});

// ─── Role propagation ─────────────────────────────────────────────────────

describe("role propagation", () => {
	it("propagates a field from a later role backward through all earlier roles", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: {
								visualType: "pivotTable",
								query: {
									queryState: {
										Columns: {
											projections: [
												{
													field: { Column: { Expression: { SourceRef: { Entity: "Cal" } }, Property: "Year" } },
													queryRef: "Cal.Year",
												},
											],
										},
										Rows: {
											projections: [
												{
													field: { Column: { Expression: { SourceRef: { Entity: "Sales" } }, Property: "Country" } },
													queryRef: "Sales.Country",
												},
											],
										},
									},
								},
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const countryRefs = references.filter((r) => r.queryRef === "Sales.Country");
		// Sales.Country appears in Rows (index 1), so it propagates to Columns (index 0) too
		expect(countryRefs.some((r) => r.role === "Columns")).toBe(true);
		expect(countryRefs.some((r) => r.role === "Rows")).toBe(true);
	});
});

// ─── Visual-level filter extraction ──────────────────────────────────────

describe("visual-level filters", () => {
	it("emits visual-filter role for filterConfig in visual.json", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: { displayName: "P1", pageBinding: { type: "Default" } },
				visuals: [
					{
						id: "V1",
						visual: {
							name: "V1",
							visual: { visualType: "card" },
							filterConfig: {
								filters: [
									{
										field: {
											Column: {
												Expression: { SourceRef: { Entity: "Sales" } },
												Property: "Region",
											},
										},
									},
								],
							},
						},
					},
				],
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const filterRef = references.find((r) => r.role === "visual-filter");
		expect(filterRef?.queryRef).toBe("Sales.Region");
		expect(filterRef?.visualId).toBe("V1");
		expect(filterRef?.pageType).toBe("Default");
	});
});

// ─── Page-level filter extraction ────────────────────────────────────────

describe("page-level filters", () => {
	it("emits page-filter role for filterConfig in page.json", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: {
					name: "Page1",
					displayName: "P1",
					pageBinding: { type: "Default" },
					filterConfig: {
						filters: [
							{
								field: {
									Column: {
										Expression: { SourceRef: { Entity: "Sales" } },
										Property: "OrderDate",
									},
								},
							},
						],
					},
				},
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const filterRef = references.find((r) => r.role === "page-filter");
		expect(filterRef?.queryRef).toBe("Sales.OrderDate");
		expect(filterRef?.pageName).toBe("P1");
		expect(filterRef?.visualType).toBe("Page");
		expect(filterRef?.visualId).toBe("Page1");
		expect(filterRef?.pageType).toBe("Default");
	});
});

// ─── Report-level filter extraction ──────────────────────────────────────

describe("report-level filters", () => {
	it("emits report-filter role for filterConfig in report.json", async () => {
		const zip = await makePbirZip(
			[],
			{
				filterConfig: {
					filters: [
						{
							field: {
								Column: {
									Expression: { SourceRef: { Entity: "Sales" } },
									Property: "Freight",
								},
							},
						},
					],
				},
			},
		);

		const { references } = await extractPbirRawFieldReferences(zip, "Sales Report");
		const filterRef = references.find((r) => r.role === "report-filter");
		expect(filterRef?.queryRef).toBe("Sales.Freight");
		expect(filterRef?.visualType).toBe("Report");
		expect(filterRef?.pageName).toBe("Report");
		expect(filterRef?.pageIndex).toBe(-1);
	});
});

// ─── Drillthrough fields ──────────────────────────────────────────────────

describe("drillthrough fields", () => {
	it("emits drillthrough-field role for parameters with fieldExpr on Drillthrough pages", async () => {
		const zip = await makePbirZip([
			{
				id: "DTPage",
				page: {
					name: "DTPage",
					displayName: "Detail",
					pageBinding: {
						type: "Drillthrough",
						parameters: [
							{
								name: "Param1",
								fieldExpr: {
									Column: {
										Expression: { SourceRef: { Entity: "Stores" } },
										Property: "StoreName",
									},
								},
							},
						],
					},
				},
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const drillRef = references.find((r) => r.role === "drillthrough-field");
		expect(drillRef).toBeDefined();
		expect(drillRef?.queryRef).toBe("Stores.StoreName");
		expect(drillRef?.pageName).toBe("Detail");
		expect(drillRef?.pageType).toBe("Drillthrough");
		expect(drillRef?.visualType).toBe("Page");
	});

	it("skips parameters without fieldExpr", async () => {
		const zip = await makePbirZip([
			{
				id: "DTPage",
				page: {
					name: "DTPage",
					displayName: "Detail",
					pageBinding: {
						type: "Drillthrough",
						parameters: [
							{ name: "ParamNoField" },
						],
					},
				},
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references.filter((r) => r.role === "drillthrough-field")).toHaveLength(0);
	});

	it("does not emit drillthrough-field on Default pages", async () => {
		const zip = await makePbirZip([
			{
				id: "Page1",
				page: {
					displayName: "P1",
					pageBinding: { type: "Default" },
				},
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		expect(references.filter((r) => r.role === "drillthrough-field")).toHaveLength(0);
	});
});

// ─── pageType propagation ─────────────────────────────────────────────────

describe("pageType on references", () => {
	it("sets pageType=Tooltip for Tooltip pages", async () => {
		const zip = await makePbirZip([
			{
				id: "TT",
				page: {
					displayName: "Tip",
					pageBinding: { type: "Tooltip" },
					filterConfig: {
						filters: [
							{
								field: {
									Column: { Expression: { SourceRef: { Entity: "Sales" } }, Property: "Amount" },
								},
							},
						],
					},
				},
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const ref = references.find((r) => r.pageName === "Tip");
		expect(ref?.pageType).toBe("Tooltip");
	});

	it("sets pageType=Drillthrough for Drillthrough pages", async () => {
		const zip = await makePbirZip([
			{
				id: "DT",
				page: {
					displayName: "Detail",
					pageBinding: {
						type: "Drillthrough",
						parameters: [
							{
								fieldExpr: {
									Column: { Expression: { SourceRef: { Entity: "Sales" } }, Property: "Region" },
								},
							},
						],
					},
				},
			},
		]);

		const { references } = await extractPbirRawFieldReferences(zip);
		const ref = references.find((r) => r.pageName === "Detail");
		expect(ref?.pageType).toBe("Drillthrough");
	});
});

// ─── Resilience ───────────────────────────────────────────────────────────

describe("resilience", () => {
	it("returns empty ExtractionResult when pages.json is missing", async () => {
		const { default: JSZip } = await import("jszip");
		const zip = new JSZip();
		zip.file("Report/definition/report.json", "{}");

		const result = await extractPbirRawFieldReferences(zip);
		expect(result.references).toHaveLength(0);
	});

	it("skips a page when page.json is missing", async () => {
		const { default: JSZip } = await import("jszip");
		const zip = new JSZip();
		zip.file(
			"Report/definition/pages/pages.json",
			JSON.stringify({ pageOrder: ["MissingPage"] }),
		);
		zip.file("Report/definition/report.json", "{}");

		const result = await extractPbirRawFieldReferences(zip);
		expect(result.references).toHaveLength(0);
	});

	it("skips a visual when visual.json is malformed JSON", async () => {
		const { default: JSZip } = await import("jszip");
		const zip = new JSZip();
		zip.file(
			"Report/definition/pages/pages.json",
			JSON.stringify({ pageOrder: ["Page1"] }),
		);
		zip.file(
			"Report/definition/pages/Page1/page.json",
			JSON.stringify({ displayName: "P1", pageBinding: { type: "Default" } }),
		);
		zip.file(
			"Report/definition/pages/Page1/visuals/V1/visual.json",
			"{ not valid json }",
		);
		zip.file("Report/definition/report.json", "{}");

		const result = await extractPbirRawFieldReferences(zip);
		expect(result.references).toHaveLength(0);
	});
});

// ─── Integration test with real fixture ──────────────────────────────────

describe("integration: pbir-enabled.pbix fixture", () => {
	async function loadFixtureZip() {
		const fixturePath = resolve(process.cwd(), "src", "test", "fixtures", "pbir-enabled.pbix");
		const buffer = readFileSync(fixturePath);
		const { default: JSZip } = await import("jszip");
		return JSZip.loadAsync(buffer);
	}

	it("extracts references from the real pbir-enabled.pbix fixture", async () => {
		const zip = await loadFixtureZip();
		const result = await extractPbirRawFieldReferences(zip, "PBIR Test Report");

		expect(result.references.length).toBeGreaterThan(0);
	});

	it("all references have non-empty queryRef", async () => {
		const zip = await loadFixtureZip();
		const result = await extractPbirRawFieldReferences(zip, "PBIR Test Report");

		for (const ref of result.references) {
			expect(ref.queryRef.trim().length).toBeGreaterThan(0);
		}
	});

	it("all page-bound references have a defined pageType", async () => {
		const zip = await loadFixtureZip();
		const result = await extractPbirRawFieldReferences(zip, "PBIR Test Report");

		// Report-level refs (pageIndex === -1) are cross-page and intentionally have no pageType.
		const pageBound = result.references.filter((r) => r.pageIndex >= 0);
		expect(pageBound.length).toBeGreaterThan(0);
		for (const ref of pageBound) {
			expect(ref.pageType).toBeDefined();
		}
	});

	it("all 14 pages are present in pageOrder", async () => {
		const zip = await loadFixtureZip();
		const result = await extractPbirRawFieldReferences(zip);

		expect(result.context.pageOrder.size).toBe(14);
	});

	it("has at least one drillthrough-field reference (from Drillthrough page)", async () => {
		const zip = await loadFixtureZip();
		const result = await extractPbirRawFieldReferences(zip);

		const dtRefs = result.references.filter((r) => r.role === "drillthrough-field");
		expect(dtRefs.length).toBeGreaterThan(0);
	});

	it("has report-level filter references", async () => {
		const zip = await loadFixtureZip();
		const result = await extractPbirRawFieldReferences(zip);

		const reportFilters = result.references.filter((r) => r.role === "report-filter");
		expect(reportFilters.length).toBeGreaterThan(0);
	});
});
