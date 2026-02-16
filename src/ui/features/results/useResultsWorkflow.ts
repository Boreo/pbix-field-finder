// src/ui/features/results/useResultsWorkflow.ts
// Contract: reducer transitions are the single source of truth for workflow status.
import { useCallback, useReducer, useRef } from "react";
import { isPbixError } from "../../../core/errors";
import { analyseReport, type AnalysisResult } from "../../../core/report-analyser";
import { loadPbixLayout } from "../../../io/pbix-loader";
import {
	combineAnalysisResults,
	createReportNameCounts,
	deriveReportName,
	getPbixErrorMessage,
	makeUniqueReportName,
} from "./results.utils";
import type {
	BatchStatus,
	LoadedFileEntry,
	ResultsWorkflowAction,
	ResultsWorkflowState,
} from "./workflow.types";

const INITIAL_STATE: ResultsWorkflowState = {
	status: "idle",
	latestResult: null,
	latestDatasetLabel: "",
	batchStatus: null,
	validationMessage: null,
	loadedFiles: [],
};

const MAX_PROCESSING_CONCURRENCY = 3;

type FileProcessingOutcome = {
	entry: LoadedFileEntry;
	result: AnalysisResult | null;
	errorMessage: string | null;
};

/**
 * Apply a workflow action to the current results state.
 * @param state Current workflow state snapshot.
 * @param action Discrete state-transition action from UI or processing side effects.
 * @returns The next workflow state after applying the action.
 */
function reducer(state: ResultsWorkflowState, action: ResultsWorkflowAction): ResultsWorkflowState {
	switch (action.type) {
		case "set_validation_message":
			return { ...state, validationMessage: action.message };
		case "set_loaded_files":
			return { ...state, loadedFiles: action.files };
		case "toggle_file_visibility":
			return {
				...state,
				loadedFiles: state.loadedFiles.map((entry) =>
					entry.id === action.fileId ? { ...entry, visible: !entry.visible } : entry,
				),
			};
		case "reset_results":
			return {
				...state,
				status: "idle",
				latestResult: null,
				latestDatasetLabel: "",
				batchStatus: null,
			};
		case "start_processing":
			return {
				...state,
				status: "processing",
				validationMessage: null,
				latestResult: null,
				latestDatasetLabel: "",
				batchStatus: null,
			};
		case "complete_processing":
			return {
				...state,
				status: action.latestResult ? "ready" : action.batchStatus.failures.length > 0 ? "error" : "idle",
				batchStatus: action.batchStatus,
				latestResult: action.latestResult,
				latestDatasetLabel: action.latestDatasetLabel,
			};
		default:
			return state;
	}
}

/**
 * Process items with a bounded number of concurrent workers while preserving output order.
 * @param items Input items to process.
 * @param concurrency Maximum worker count to run in parallel.
 * @param worker Async worker called once for each item and index.
 * @returns Output values aligned to original input order.
 */
async function runWithConcurrency<TInput, TOutput>(
	items: TInput[],
	concurrency: number,
	worker: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
	if (items.length === 0) {
		return [];
	}

	const output: TOutput[] = new Array(items.length);
	let cursor = 0;

	async function runWorker(): Promise<void> {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			output[index] = await worker(items[index], index);
		}
	}

	const workerCount = Math.min(Math.max(1, concurrency), items.length);
	await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

	return output;
}

/**
 * Convert internal processing errors into safe user-facing status messages.
 * @param error Unknown error from load or analysis stages.
 * @returns A user-facing error string suitable for batch status rendering.
 */
function toUserFacingErrorMessage(error: unknown): string {
	if (isPbixError(error)) {
		return getPbixErrorMessage(error.code);
	}
	return "Unexpected error while processing file.";
}

/**
 * Process one loaded file through PBIX loading and report analysis.
 * @param entry Loaded file entry containing file payload and derived report name.
 * @returns Processing outcome with either a successful analysis result or a user-facing error.
 */
async function processFileEntry(entry: LoadedFileEntry): Promise<FileProcessingOutcome> {
	try {
		const layout = await loadPbixLayout(entry.file);
		const result = analyseReport(layout, entry.reportName);
		return {
			entry,
			result,
			errorMessage: null,
		};
	} catch (error) {
		return {
			entry,
			result: null,
			errorMessage: toUserFacingErrorMessage(error),
		};
	}
}

/**
 * Manage end-to-end file ingestion, processing, and result aggregation for the UI.
 * NOTE: Partial failures are preserved so one bad file does not block successful files in the same batch.
 * @returns Workflow state plus actions for file selection, removal, visibility, and validation messaging.
 */
export function useResultsWorkflow() {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	const fileIdRef = useRef(0);
	const isProcessing = state.status === "processing";

	const toLoadedEntries = useCallback(
		(files: File[], existing: LoadedFileEntry[]): LoadedFileEntry[] => {
			const reportNameCounts = createReportNameCounts(existing);
			return files.map((file) => {
				const baseReportName = deriveReportName(file.name);
				const reportName = makeUniqueReportName(baseReportName, reportNameCounts);
				return {
					id: `file-${fileIdRef.current++}`,
					file,
					baseReportName,
					reportName,
					visible: true,
					errorMessage: null,
				};
			});
		},
		[],
	);

	const processLoadedFiles = useCallback(async (filesToProcess: LoadedFileEntry[]) => {
		if (filesToProcess.length === 0) {
			dispatch({ type: "reset_results" });
			return;
		}

		dispatch({ type: "start_processing" });

		const outcomes = await runWithConcurrency(
			filesToProcess,
			MAX_PROCESSING_CONCURRENCY,
			(entry) => processFileEntry(entry),
		);

		const successes: Array<{ reportName: string; result: AnalysisResult }> = [];
		const failures: BatchStatus["failures"] = [];
		const failureByFileId = new Map<string, string>();

		for (const outcome of outcomes) {
			if (outcome.result) {
				successes.push({
					reportName: outcome.entry.reportName,
					result: outcome.result,
				});
				continue;
			}

			const message = outcome.errorMessage ?? "Unexpected error while processing file.";
			failures.push({
				fileName: outcome.entry.file.name,
				message,
			});
			failureByFileId.set(outcome.entry.id, message);
		}

		const nextLoadedFiles = filesToProcess.map((entry) => ({
			...entry,
			errorMessage: failureByFileId.get(entry.id) ?? null,
		}));
		dispatch({ type: "set_loaded_files", files: nextLoadedFiles });

		const batchStatus: BatchStatus = {
			total: filesToProcess.length,
			successCount: successes.length,
			failures,
		};

		if (successes.length === 0) {
			dispatch({
				type: "complete_processing",
				batchStatus,
				latestResult: null,
				latestDatasetLabel: "",
			});
			return;
		}

		const combined = combineAnalysisResults(successes.map((item) => item.result));
		dispatch({
			type: "complete_processing",
			batchStatus,
			latestResult: combined,
			latestDatasetLabel: successes.length === 1 ? successes[0].reportName : "output",
		});
	}, []);

	const onFilesAccepted = useCallback(
		(files: File[]) => {
			if (files.length === 0 || isProcessing) {
				return;
			}
			dispatch({ type: "set_validation_message", message: null });
			const incoming = toLoadedEntries(files, state.loadedFiles);
			const next = state.loadedFiles.length > 0 ? [...state.loadedFiles, ...incoming] : incoming;
			dispatch({ type: "set_loaded_files", files: next });
			void processLoadedFiles(next);
		},
		[isProcessing, processLoadedFiles, state.loadedFiles, toLoadedEntries],
	);

	const onRemoveFile = useCallback(
		(fileId: string) => {
			if (isProcessing) {
				return;
			}
			const next = state.loadedFiles.filter((entry) => entry.id !== fileId);
			dispatch({ type: "set_loaded_files", files: next });
			void processLoadedFiles(next);
		},
		[isProcessing, processLoadedFiles, state.loadedFiles],
	);

	const onClearFiles = useCallback(() => {
		if (isProcessing) {
			return;
		}
		dispatch({ type: "set_validation_message", message: null });
		dispatch({ type: "set_loaded_files", files: [] });
		void processLoadedFiles([]);
	}, [isProcessing, processLoadedFiles]);

	const onToggleFileVisibility = useCallback((fileId: string) => {
		dispatch({ type: "toggle_file_visibility", fileId });
	}, []);

	const setValidationMessage = useCallback((message: string | null) => {
		dispatch({ type: "set_validation_message", message });
	}, []);

	return {
		...state,
		isProcessing,
		onFilesAccepted,
		onRemoveFile,
		onClearFiles,
		onToggleFileVisibility,
		setValidationMessage,
	};
}
