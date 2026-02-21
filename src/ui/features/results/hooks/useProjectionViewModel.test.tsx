// src/ui/features/results/useProjectionViewModel.test.tsx
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "@/core/report-analyser";
import { useProjectionViewModel } from "./useProjectionViewModel";
import type { LoadedFileEntry } from "../workflow/types";

const resultFixture: AnalysisResult = {
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

	it("filters rows based on loaded-file visibility flags", () => {
		const latestResult: AnalysisResult = {
			normalised: [
				{ ...resultFixture.normalised[0], report: "Sales" },
				{ ...resultFixture.normalised[0], report: "Finance", visualId: "v2" },
			],
		};
		const loadedFiles: LoadedFileEntry[] = [
			{
				...loadedFilesFixture[0],
				reportName: "Sales",
				baseReportName: "Sales",
				file: new File(["x"], "Sales.pbix"),
				visible: true,
			},
			{
				...loadedFilesFixture[0],
				id: "file-2",
				reportName: "Finance",
				baseReportName: "Finance",
				file: new File(["x"], "Finance.pbix"),
				visible: false,
			},
		];

		const { result } = renderHook(() =>
			useProjectionViewModel({
				latestResult,
				latestDatasetLabel: "output",
				isProcessing: false,
				loadedFiles,
			}),
		);

		expect(result.current.filteredNormalised).toHaveLength(1);
		expect(result.current.filteredNormalised[0]?.report).toBe("Sales");
	});

	it("memoizes projections when inputs are stable", () => {
		const props = {
			latestResult: resultFixture,
			latestDatasetLabel: "Sales",
			isProcessing: false,
			loadedFiles: loadedFilesFixture,
		};

		const { result, rerender } = renderHook(
			(input: typeof props) =>
				useProjectionViewModel({
					latestResult: input.latestResult,
					latestDatasetLabel: input.latestDatasetLabel,
					isProcessing: input.isProcessing,
					loadedFiles: input.loadedFiles,
				}),
			{ initialProps: props },
		);

		const firstCanonical = result.current.canonicalUsages;
		const firstSummary = result.current.summaryRows;

		rerender(props);

		expect(result.current.canonicalUsages).toBe(firstCanonical);
		expect(result.current.summaryRows).toBe(firstSummary);
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

	it("disables details projection when canonical row count exceeds threshold", () => {
		const hugeResult: AnalysisResult = {
			normalised: Array.from({ length: 100_001 }, (_, index) => ({
				...resultFixture.normalised[0],
				visualId: `v-${index}`,
			})),
		};

		const { result } = renderHook(() =>
			useProjectionViewModel({
				latestResult: hugeResult,
				latestDatasetLabel: "Sales",
				isProcessing: false,
				loadedFiles: loadedFilesFixture,
			}),
		);

		expect(result.current.canonicalUsages).toHaveLength(100_001);
		expect(result.current.detailsRows).toEqual([]);
	});

	it("reports singleReportMode false when multiple reports are visible", () => {
		const latestResult: AnalysisResult = {
			normalised: [
				{ ...resultFixture.normalised[0], report: "Sales" },
				{ ...resultFixture.normalised[0], report: "Finance", visualId: "v2" },
			],
		};
		const loadedFiles: LoadedFileEntry[] = [
			{
				...loadedFilesFixture[0],
				reportName: "Sales",
				baseReportName: "Sales",
				file: new File(["x"], "Sales.pbix"),
				visible: true,
			},
			{
				...loadedFilesFixture[0],
				id: "file-2",
				reportName: "Finance",
				baseReportName: "Finance",
				file: new File(["x"], "Finance.pbix"),
				visible: true,
			},
		];

		const { result } = renderHook(() =>
			useProjectionViewModel({
				latestResult,
				latestDatasetLabel: "output",
				isProcessing: false,
				loadedFiles,
			}),
		);

		expect(result.current.singleReportMode).toBe(false);
	});
});

