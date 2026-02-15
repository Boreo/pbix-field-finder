// src/ui/features/results/useResultsWorkflow.test.tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult } from "../../../core/report-analyser";
import { useResultsWorkflow } from "./useResultsWorkflow";

const mocks = vi.hoisted(() => ({
	loadPbixLayout: vi.fn(),
	analyseReport: vi.fn(),
	isPbixError: vi.fn((error: unknown) => Boolean((error as { isPbixError?: boolean })?.isPbixError)),
}));

vi.mock("../../../io/pbix-loader", () => ({ loadPbixLayout: mocks.loadPbixLayout }));
vi.mock("../../../core/report-analyser", () => ({ analyseReport: mocks.analyseReport }));
vi.mock("../../../core/errors", () => ({ isPbixError: mocks.isPbixError }));

const analysisFixture: AnalysisResult = {
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

describe("useResultsWorkflow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.loadPbixLayout.mockResolvedValue({});
		mocks.analyseReport.mockReturnValue(analysisFixture);
	});

	it("processes accepted files and populates workflow state", async () => {
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([new File(["x"], "sales.pbix")]);
		});

		await waitFor(() => expect(result.current.batchStatus?.successCount).toBe(1));

		expect(result.current.loadedFiles).toHaveLength(1);
		expect(result.current.loadedFiles[0].errorMessage).toBeNull();
		expect(result.current.latestResult?.normalised).toHaveLength(1);
		expect(result.current.latestDatasetLabel).toBe("sales");
		expect(result.current.status).toBe("ready");
	});

	it("keeps ready state for partial success and marks failed file entries", async () => {
		mocks.loadPbixLayout
			.mockResolvedValueOnce({})
			.mockRejectedValueOnce({
				isPbixError: true,
				code: "LAYOUT_NOT_FOUND",
			});

		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([
				new File(["x"], "good.pbix"),
				new File(["x"], "bad.pbix"),
			]);
		});

		await waitFor(() => expect(result.current.batchStatus?.total).toBe(2));
		expect(result.current.status).toBe("ready");
		expect(result.current.batchStatus?.successCount).toBe(1);
		expect(result.current.batchStatus?.failures.length).toBe(1);
		expect(result.current.loadedFiles).toHaveLength(2);
		expect(result.current.loadedFiles[0].errorMessage).toBeNull();
		expect(result.current.loadedFiles[1].errorMessage).toBe(
			"The PBIX file does not contain a report layout.",
		);
	});

	it("clears loaded files and results", async () => {
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([new File(["x"], "sales.pbix")]);
		});
		await waitFor(() => expect(result.current.batchStatus?.successCount).toBe(1));

		act(() => {
			result.current.onClearFiles();
		});

		await waitFor(() => expect(result.current.loadedFiles).toHaveLength(0));
		expect(result.current.latestResult).toBeNull();
		expect(result.current.latestDatasetLabel).toBe("");
		expect(result.current.batchStatus).toBeNull();
		expect(result.current.status).toBe("idle");
	});

	it("captures pbix-specific failure messages", async () => {
		mocks.loadPbixLayout.mockRejectedValue({
			isPbixError: true,
			code: "PBIX_NOT_ZIP",
		});

		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([new File(["x"], "bad.pbix")]);
		});

		await waitFor(() => expect(result.current.batchStatus?.failures.length).toBe(1));
		expect(result.current.latestResult).toBeNull();
		expect(result.current.status).toBe("error");
		expect(result.current.batchStatus?.failures[0]?.message).toBe(
			"The selected file is not a valid PBIX file.",
		);
	});
});
