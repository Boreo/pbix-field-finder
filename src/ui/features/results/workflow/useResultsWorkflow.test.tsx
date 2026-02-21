// src/ui/features/results/useResultsWorkflow.test.tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult } from "@/core/report-analyser";
import { useResultsWorkflow } from "./useResultsWorkflow";

const mocks = vi.hoisted(() => ({
	loadPbixLayout: vi.fn(),
	analyseReport: vi.fn(),
	isPbixError: vi.fn((error: unknown) => Boolean((error as { isPbixError?: boolean })?.isPbixError)),
}));

vi.mock("@/io/pbix-loader", () => ({ loadPbixLayout: mocks.loadPbixLayout }));
vi.mock("@/core/report-analyser", () => ({ analyseReport: mocks.analyseReport }));
vi.mock("@/core/errors", () => ({ isPbixError: mocks.isPbixError }));

const analysisFixture: AnalysisResult = {
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

	it("starts in idle state with no loaded files", () => {
		const { result } = renderHook(() => useResultsWorkflow());

		expect(result.current.status).toBe("idle");
		expect(result.current.loadedFiles).toEqual([]);
		expect(result.current.latestResult).toBeNull();
		expect(result.current.latestDatasetLabel).toBe("");
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

	it("merges successful files without retaining raw rows when analyses are normalised-only", async () => {
		mocks.analyseReport
			.mockReturnValueOnce({
				normalised: [{ ...analysisFixture.normalised[0], report: "good-1" }],
			})
			.mockReturnValueOnce({
				normalised: [{ ...analysisFixture.normalised[0], report: "good-2" }],
			});

		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([
				new File(["x"], "good-1.pbix"),
				new File(["x"], "good-2.pbix"),
			]);
		});

		await waitFor(() => expect(result.current.batchStatus?.successCount).toBe(2));

		expect(result.current.latestResult?.normalised).toHaveLength(2);
		expect(result.current.latestResult?.raw).toBeUndefined();
	});

	it("assigns unique report names when duplicate filenames are uploaded", async () => {
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([
				new File(["x"], "Sales.pbix"),
				new File(["x"], "Sales.pbix"),
			]);
		});

		await waitFor(() => expect(result.current.batchStatus?.successCount).toBe(2));
		expect(result.current.loadedFiles.map((entry) => entry.reportName)).toEqual(["Sales", "Sales-2"]);
		expect(result.current.latestDatasetLabel).toBe("output");
	});

	it("toggles visibility for loaded files", async () => {
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([new File(["x"], "sales.pbix")]);
		});
		await waitFor(() => expect(result.current.batchStatus?.successCount).toBe(1));

		const fileId = result.current.loadedFiles[0]?.id;
		expect(fileId).toBeDefined();

		act(() => {
			result.current.onToggleFileVisibility(fileId!);
		});
		expect(result.current.loadedFiles[0]?.visible).toBe(false);

		act(() => {
			result.current.onToggleFileVisibility(fileId!);
		});
		expect(result.current.loadedFiles[0]?.visible).toBe(true);
	});

	it("removes a file and reprocesses the remaining batch", async () => {
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([
				new File(["x"], "first.pbix"),
				new File(["x"], "second.pbix"),
			]);
		});
		await waitFor(() => expect(result.current.batchStatus?.successCount).toBe(2));

		const secondId = result.current.loadedFiles[1]?.id;
		expect(secondId).toBeDefined();

		act(() => {
			result.current.onRemoveFile(secondId!);
		});

		await waitFor(() => expect(result.current.batchStatus?.total).toBe(1));
		expect(result.current.loadedFiles).toHaveLength(1);
		expect(result.current.loadedFiles[0]?.reportName).toBe("first");
		expect(result.current.latestDatasetLabel).toBe("first");
	});

	it("does not accept additional files while processing is already running", async () => {
		const blockers: Array<() => void> = [];
		mocks.loadPbixLayout.mockImplementation(
			() =>
				new Promise((resolve) => {
					blockers.push(() => resolve({}));
				}),
		);

		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([new File(["x"], "first.pbix")]);
		});

		await waitFor(() => expect(result.current.status).toBe("processing"));
		expect(result.current.loadedFiles).toHaveLength(1);

		act(() => {
			result.current.onFilesAccepted([new File(["x"], "second.pbix")]);
		});
		expect(result.current.loadedFiles).toHaveLength(1);

		act(() => {
			for (const release of blockers) {
				release();
			}
		});

		await waitFor(() => expect(result.current.status).toBe("ready"));
		expect(mocks.loadPbixLayout).toHaveBeenCalledTimes(1);
	});

	it("processes files with a maximum concurrency of three workers", async () => {
		const releases: Array<() => void> = [];
		let active = 0;
		let maxActive = 0;

		mocks.loadPbixLayout.mockImplementation(
			() =>
				new Promise((resolve) => {
					active += 1;
					maxActive = Math.max(maxActive, active);
					releases.push(() => {
						active -= 1;
						resolve({});
					});
				}),
		);

		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([
				new File(["x"], "one.pbix"),
				new File(["x"], "two.pbix"),
				new File(["x"], "three.pbix"),
				new File(["x"], "four.pbix"),
				new File(["x"], "five.pbix"),
			]);
		});

		await waitFor(() => expect(releases).toHaveLength(3));
		expect(maxActive).toBe(3);

		act(() => {
			releases.slice(0, 3).forEach((release) => release());
		});
		await waitFor(() => expect(releases).toHaveLength(5));
		expect(maxActive).toBe(3);

		act(() => {
			releases.slice(3).forEach((release) => release());
		});

		await waitFor(() => expect(result.current.status).toBe("ready"));
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

	it("uses fallback failure message for unknown errors", async () => {
		mocks.loadPbixLayout.mockRejectedValue(new Error("boom"));
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([new File(["x"], "bad.pbix")]);
		});

		await waitFor(() => expect(result.current.batchStatus?.failures.length).toBe(1));
		expect(result.current.batchStatus?.failures[0]?.message).toBe("Unexpected error while processing file.");
		expect(result.current.status).toBe("error");
	});

	it("sets and clears validation message via setter", () => {
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.setValidationMessage("Unsupported files: notes.txt.");
		});
		expect(result.current.validationMessage).toBe("Unsupported files: notes.txt.");

		act(() => {
			result.current.setValidationMessage(null);
		});
		expect(result.current.validationMessage).toBeNull();
	});

	it("ignores onFilesAccepted when given an empty file list", () => {
		const { result } = renderHook(() => useResultsWorkflow());

		act(() => {
			result.current.onFilesAccepted([]);
		});

		expect(result.current.status).toBe("idle");
		expect(result.current.loadedFiles).toHaveLength(0);
		expect(mocks.loadPbixLayout).not.toHaveBeenCalled();
	});

	it("ignores remove and clear actions while processing", async () => {
		const blockers: Array<() => void> = [];
		mocks.loadPbixLayout.mockImplementation(
			() =>
				new Promise((resolve) => {
					blockers.push(() => resolve({}));
				}),
		);

		const { result } = renderHook(() => useResultsWorkflow());
		act(() => {
			result.current.onFilesAccepted([new File(["x"], "sales.pbix")]);
		});
		await waitFor(() => expect(result.current.status).toBe("processing"));

		const fileId = result.current.loadedFiles[0]?.id;
		expect(fileId).toBeDefined();

		act(() => {
			result.current.onRemoveFile(fileId!);
			result.current.onClearFiles();
		});
		expect(result.current.loadedFiles).toHaveLength(1);

		act(() => {
			blockers.forEach((release) => release());
		});
		await waitFor(() => expect(result.current.status).toBe("ready"));
	});
});

