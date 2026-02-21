import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "@/core/report-analyser";
import type { LoadedFileEntry } from "./types";
import {
	combineAnalysisResults,
	createReportNameCounts,
	deriveReportName,
	getPbixErrorMessage,
	makeUniqueReportName,
} from "./resultsWorkflow.utils";

describe("results.utils", () => {
	it("maps each pbix error code to a user-facing message", () => {
		expect(getPbixErrorMessage("PBIX_NOT_ZIP")).toBe("The selected file is not a valid PBIX file.");
		expect(getPbixErrorMessage("LAYOUT_NOT_FOUND")).toBe("The PBIX file does not contain a report layout.");
		expect(getPbixErrorMessage("LAYOUT_DECODE_FAILED")).toBe("The report layout could not be decoded.");
		expect(getPbixErrorMessage("LAYOUT_PARSE_FAILED")).toBe("The report layout is corrupted.");
	});

	it("derives report names from file names and handles empty names", () => {
		expect(deriveReportName("Sales.pbix")).toBe("Sales");
		expect(deriveReportName("Finance.ZIP")).toBe("Finance");
		expect(deriveReportName("  Team Dashboard  ")).toBe("Team Dashboard");
		expect(deriveReportName(".pbix")).toBe("report");
	});

	it("creates deterministic unique report names with numeric suffixes", () => {
		const seen = new Map<string, number>();
		expect(makeUniqueReportName("Sales", seen)).toBe("Sales");
		expect(makeUniqueReportName("Sales", seen)).toBe("Sales-2");
		expect(makeUniqueReportName("Sales", seen)).toBe("Sales-3");
		expect(makeUniqueReportName("Finance", seen)).toBe("Finance");
	});

	it("counts existing loaded files by base report name", () => {
		const files: LoadedFileEntry[] = [
			{
				id: "file-1",
				file: new File(["x"], "Sales.pbix"),
				baseReportName: "Sales",
				reportName: "Sales",
				visible: true,
				errorMessage: null,
			},
			{
				id: "file-2",
				file: new File(["x"], "Sales-copy.pbix"),
				baseReportName: "Sales",
				reportName: "Sales-2",
				visible: true,
				errorMessage: null,
			},
			{
				id: "file-3",
				file: new File(["x"], "Finance.pbix"),
				baseReportName: "Finance",
				reportName: "Finance",
				visible: false,
				errorMessage: null,
			},
		];

		const counts = createReportNameCounts(files);
		expect(counts.get("Sales")).toBe(2);
		expect(counts.get("Finance")).toBe(1);
		expect(counts.get("Missing")).toBeUndefined();
	});

	it("combines normalised results without creating raw rows when absent", () => {
		const combined = combineAnalysisResults([
			{ normalised: [{ report: "A" }] as AnalysisResult["normalised"] },
			{ normalised: [{ report: "B" }] as AnalysisResult["normalised"] },
		]);

		expect(combined.normalised).toHaveLength(2);
		expect(combined.raw).toBeUndefined();
	});

	it("combines optional raw arrays when any result includes raw data", () => {
		const combined = combineAnalysisResults([
			{
				raw: [{ queryRef: "'Sales'[Amount]" }] as AnalysisResult["raw"],
				normalised: [{ report: "Sales" }] as AnalysisResult["normalised"],
			},
			{
				normalised: [{ report: "Finance" }] as AnalysisResult["normalised"],
			},
		]);

		expect(combined.normalised).toHaveLength(2);
		expect(combined.raw).toEqual([{ queryRef: "'Sales'[Amount]" }]);
	});
});

