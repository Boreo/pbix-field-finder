import { afterEach, describe, expect, it, vi } from "vitest";
import { isPbixError } from "@/core/errors";
import {
	createInvalidPbixFile,
	createMockPbirFile,
	createMockPbixFile,
	createMockZipBuffer,
	createPbixFileFromBuffer,
} from "../test/fixtures/mockPbixFile";
import { loadPbixExtractionResult, loadPbixLayout } from "./pbix-loader";

async function expectPbixErrorCode(promise: Promise<unknown>, expectedCode: string) {
	try {
		await promise;
		throw new Error(`Expected PbixError with code ${expectedCode}`);
	} catch (error) {
		expect(isPbixError(error)).toBe(true);
		if (isPbixError(error)) {
			expect(error.code).toBe(expectedCode);
		}
	}
}

describe("loadPbixLayout", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads layout from Report/Layout (old format)", async () => {
		const layout = { id: 1, sections: [{ name: "Overview" }] };
		const file = await createMockPbixFile(JSON.stringify(layout), {
			layoutPath: "Report/Layout",
		});

		const result = await loadPbixLayout(file);

		expect(result).toEqual(layout);
	});

	it("loads layout from Report/Layout.json (new format)", async () => {
		const layout = { id: 2, sections: [{ name: "Finance" }] };
		const file = await createMockPbixFile(JSON.stringify(layout), {
			layoutPath: "Report/Layout.json",
		});

		const result = await loadPbixLayout(file);

		expect(result).toEqual(layout);
	});

	it("prefers Report/Layout when both layout paths are present", async () => {
		const oldLayout = { id: 10, sections: [{ name: "Old" }] };
		const newLayout = { id: 20, sections: [{ name: "New" }] };
		const buffer = await createMockZipBuffer({
			"Report/Layout": JSON.stringify(oldLayout),
			"Report/Layout.json": JSON.stringify(newLayout),
		});
		const file = createPbixFileFromBuffer(buffer, "both-layouts.pbix");

		const result = await loadPbixLayout(file);
		expect(result).toEqual(oldLayout);
	});

	it("decodes utf-16le layout content", async () => {
		const layout = { title: "Cafe rapport", sections: [{ displayName: "Ventes ete" }] };
		const file = await createMockPbixFile(JSON.stringify(layout));

		const result = await loadPbixLayout(file);

		expect(result).toEqual(layout);
	});

	it("throws PBIX_NOT_ZIP for invalid zip files", async () => {
		const file = createInvalidPbixFile("not-a-zip");
		await expectPbixErrorCode(loadPbixLayout(file), "PBIX_NOT_ZIP");
	});

	it("throws LAYOUT_NOT_FOUND when no layout entry exists", async () => {
		const buffer = await createMockZipBuffer({
			"Metadata/info.txt": "metadata",
		});
		const file = createPbixFileFromBuffer(buffer, "missing-layout.pbix");

		await expectPbixErrorCode(loadPbixLayout(file), "LAYOUT_NOT_FOUND");
	});

	it("throws LAYOUT_DECODE_FAILED when layout decode fails", async () => {
		const file = await createMockPbixFile(JSON.stringify({ id: 1 }));
		vi.spyOn(TextDecoder.prototype, "decode").mockImplementation(() => {
			throw new Error("decode failed");
		});

		await expectPbixErrorCode(loadPbixLayout(file), "LAYOUT_DECODE_FAILED");
	});

	it("throws LAYOUT_PARSE_FAILED for malformed JSON content", async () => {
		const file = await createMockPbixFile("{not-json");
		await expectPbixErrorCode(loadPbixLayout(file), "LAYOUT_PARSE_FAILED");
	});
});

describe("loadPbixExtractionResult", () => {
	it("routes to legacy extraction for a legacy PBIX file", async () => {
		const layout = {
			id: 1,
			reportId: 1,
			sections: [
				{
					name: "Section1",
					displayName: "P1",
					visualContainers: [],
				},
			],
		};
		const file = await createMockPbixFile(JSON.stringify(layout), {
			layoutPath: "Report/Layout",
		});

		const result = await loadPbixExtractionResult(file, "Legacy Report");
		expect(result.context.reportName).toBe("Legacy Report");
		expect(result.context.pageOrder.get("P1")).toBe(0);
	});

	it("routes to PBIR extraction for a PBIR-format file", async () => {
		const file = await createMockPbirFile(
			[
				{
					id: "Page1",
					page: {
						name: "Page1",
						displayName: "First Page",
						pageBinding: { type: "Default" },
					},
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
												projections: [{ queryRef: "Sales.Amount" }],
											},
										},
									},
								},
							},
						},
					],
				},
			],
			{},
			{ fileName: "test-pbir.pbix" },
		);

		const result = await loadPbixExtractionResult(file, "PBIR Report");
		expect(result.context.reportName).toBe("PBIR Report");
		expect(result.context.pageOrder.get("First Page")).toBe(0);
		expect(result.references.some((r) => r.queryRef === "Sales.Amount")).toBe(true);
	});

	it("extracts from a multi-page PBIR file with projections and filters", async () => {
		const file = await createMockPbirFile(
			[
				{
					id: "PageA",
					page: {
						name: "PageA",
						displayName: "Alpha",
						pageBinding: { type: "Default" },
						filterConfig: {
							filters: [
								{
									field: {
										Column: {
											Expression: { SourceRef: { Entity: "Product" } },
											Property: "Category",
										},
									},
								},
							],
						},
					},
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
											Category: {
												projections: [
													{
														field: {
															Column: {
																Expression: { SourceRef: { Entity: "Sales" } },
																Property: "Sale Size",
															},
														},
														queryRef: "Sales.Sale Size",
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
				{
					id: "PageB",
					page: {
						name: "PageB",
						displayName: "Beta",
						pageBinding: {
							type: "Drillthrough",
							parameters: [
								{
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
			],
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

		const result = await loadPbixExtractionResult(file, "Multi-Page Report");
		expect(result.context.pageOrder.size).toBe(2);
		expect(result.references.some((r) => r.queryRef === "Sum(Sales.SalesAmount)")).toBe(true);
		expect(result.references.some((r) => r.role === "page-filter")).toBe(true);
		expect(result.references.some((r) => r.role === "drillthrough-field")).toBe(true);
		expect(result.references.some((r) => r.role === "report-filter")).toBe(true);
	});

	it("throws PBIX_NOT_ZIP for an invalid zip file", async () => {
		const file = createInvalidPbixFile("not-a-zip");
		await expectPbixErrorCode(loadPbixExtractionResult(file), "PBIX_NOT_ZIP");
	});
});

