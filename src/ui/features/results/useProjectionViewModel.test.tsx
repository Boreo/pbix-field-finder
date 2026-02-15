// src/ui/features/results/useProjectionViewModel.test.tsx
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "../../../core/report-analyser";
import { useProjectionViewModel } from "./useProjectionViewModel";
import type { LoadedFileEntry } from "./workflow.types";

const resultFixture: AnalysisResult = {
	raw: [],
	normalised: [
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
	],
};

const loadedFilesFixture: LoadedFileEntry[] = [
	{
		id: "file-1",
		file: new File(["x"], "Sales.pbix"),
		baseReportName: "Sales",
		reportName: "Sales",
		visible: true,
		errorMessage: null,
	},
];

describe("useProjectionViewModel", () => {
	it("builds summary/details projections and enables export when data exists", () => {
		const { result } = renderHook(() =>
			useProjectionViewModel({
				latestResult: resultFixture,
				latestDatasetLabel: "Sales",
				isProcessing: false,
				loadedFiles: loadedFilesFixture,
			}),
		);

		expect(result.current.summaryRows).toHaveLength(1);
		expect(result.current.detailsRows).toHaveLength(1);
		expect(result.current.exportScopeLabel).toBe("Sales");
		expect(result.current.exportDisabled).toBe(false);
	});

	it("disables export when processing or no result", () => {
		const withNoResult = renderHook(() =>
			useProjectionViewModel({
				latestResult: null,
				latestDatasetLabel: "",
				isProcessing: false,
				loadedFiles: [],
			}),
		);
		expect(withNoResult.result.current.exportDisabled).toBe(true);
		expect(withNoResult.result.current.exportScopeLabel).toBe("output");

		const whileProcessing = renderHook(() =>
			useProjectionViewModel({
				latestResult: resultFixture,
				latestDatasetLabel: "Sales",
				isProcessing: true,
				loadedFiles: loadedFilesFixture,
			}),
		);
		expect(whileProcessing.result.current.exportDisabled).toBe(true);
	});
});
