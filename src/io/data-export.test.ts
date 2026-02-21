import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NormalisedFieldUsage } from "@/core/normalisation/field-normaliser";
import { buildDetailsRows, toCanonicalUsageRows, type SummaryRow } from "@/core/projections";
import { cleanupBrowserMocks, mockClipboard, mockDownload } from "../test/mocks/browserApiMocks";
import {
	copyRawCsvToClipboard,
	exportDetailsJson,
	exportRawCsv,
	exportSummaryJson,
} from "./data-export";

const mocks = vi.hoisted(() => ({
	unparse: vi.fn(() => "report,page\nSales,Overview"),
}));

vi.mock("papaparse", () => ({
	default: {
		unparse: mocks.unparse,
	},
}));

const summaryRowsFixture: SummaryRow[] = [
	{
		id: "summary:Sales|Amount",
		table: "Sales",
		field: "Amount",
		totalUses: 2,
		reportCount: 1,
		pageCount: 1,
		visualCount: 2,
		hiddenOnly: false,
		kind: "measure",
		reports: ["Sales"],
		searchText: "sales amount",
	},
];

const normalisedRowsFixture: NormalisedFieldUsage[] = [
	{
		report: "Sales",
		page: "Overview",
		pageIndex: 0,
		visualType: "table",
		visualId: "visual-1",
		visualTitle: "Sales by Amount",
		role: "values",
		table: "Sales",
		field: "Amount",
		fieldKind: "measure",
		expression: "SUM(Sales[Amount])",
		isHiddenVisual: false,
		isHiddenFilter: false,
	},
	{
		report: "Sales",
		page: "Overview",
		pageIndex: 0,
		visualType: "table",
		visualId: "visual-2",
		visualTitle: undefined,
		role: "tooltip",
		table: null,
		field: null,
		fieldKind: "expression",
		expression: null,
		isHiddenVisual: true,
		isHiddenFilter: false,
	},
];

async function readBlobText(blob: Blob): Promise<string> {
	if (typeof blob.text === "function") {
		return blob.text();
	}
	const buffer = await blob.arrayBuffer();
	return new TextDecoder().decode(buffer);
}

describe("data-export", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.unparse.mockReturnValue("report,page\nSales,Overview");
	});

	afterEach(() => {
		cleanupBrowserMocks();
	});

	it("exports summary rows as formatted json with a safe filename", async () => {
		const download = mockDownload();
		exportSummaryJson(summaryRowsFixture, "Sales:Q1/2026?");

		expect(download.clickedLinks).toHaveLength(1);
		expect(download.clickedLinks[0].download).toBe("Sales-Q1-2026--summary.json");
		expect(download.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");

		const blobText = await readBlobText(download.createdUrls[0]);
		expect(JSON.parse(blobText)).toEqual(summaryRowsFixture);
		expect(download.clickedLinks[0].isConnected).toBe(false);
	});

	it("falls back to the default report filename when scope label sanitises to empty", () => {
		const download = mockDownload();
		exportSummaryJson(summaryRowsFixture, "...");
		expect(download.clickedLinks[0].download).toBe("report-summary.json");
	});

	it("sanitizes trailing dots, whitespace, and control characters in export filenames", () => {
		const download = mockDownload();

		exportSummaryJson(summaryRowsFixture, "   Sales   Report...   ");
		exportDetailsJson(normalisedRowsFixture, "Sales\u0001Report");

		expect(download.clickedLinks[0].download).toBe("Sales Report-summary.json");
		expect(download.clickedLinks[1].download).toBe("Sales-Report-details.json");
	});

	it("exports detail rows as formatted json", async () => {
		const download = mockDownload();
		exportDetailsJson(normalisedRowsFixture, "Sales");

		expect(download.clickedLinks).toHaveLength(1);
		expect(download.clickedLinks[0].download).toBe("Sales-details.json");

		const expectedDetails = buildDetailsRows(toCanonicalUsageRows(normalisedRowsFixture));
		const blobText = await readBlobText(download.createdUrls[0]);
		expect(JSON.parse(blobText)).toEqual(expectedDetails);
	});

	it("exports raw csv with stable column ordering and null handling", async () => {
		const download = mockDownload();
		exportRawCsv(normalisedRowsFixture, "Sales");

		await waitFor(() => expect(mocks.unparse).toHaveBeenCalledTimes(1));

		const [payload, options] = mocks.unparse.mock.calls[0] as [
			{
				fields: string[];
				data: Array<Array<string | number | boolean | null>>;
			},
			{ newline: string },
		];

		expect(payload.fields).toEqual([
			"report",
			"page",
			"pageIndex",
			"visualType",
			"visualId",
			"visualTitle",
			"role",
			"table",
			"field",
			"fieldKind",
			"expression",
			"isHiddenVisual",
			"isHiddenFilter",
		]);
		expect(payload.data[1]).toEqual([
			"Sales",
			"Overview",
			0,
			"table",
			"visual-2",
			"",
			"tooltip",
			null,
			null,
			"expression",
			null,
			true,
			false,
		]);
		expect(options).toEqual({ newline: "\n" });

		await waitFor(() => expect(download.clickedLinks).toHaveLength(1));
		expect(download.clickedLinks[0].download).toBe("Sales-raw.csv");
	});

	it("copies raw csv to clipboard when browser clipboard is available", async () => {
		const { writeText } = mockClipboard();
		copyRawCsvToClipboard(normalisedRowsFixture);

		await waitFor(() => expect(writeText).toHaveBeenCalledWith("report,page\nSales,Overview"));
	});

	it("does nothing when clipboard api is unavailable", async () => {
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: undefined,
		});
		copyRawCsvToClipboard(normalisedRowsFixture);

		await waitFor(() => expect(mocks.unparse).toHaveBeenCalledTimes(1));
	});
});

