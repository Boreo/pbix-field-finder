// src/ui/features/results/workflow.types.ts
import type { AnalysisResult } from "../../../core/report-analyser";

export type FailureItem = {
	fileName: string;
	message: string;
};

export type BatchStatus = {
	total: number;
	successCount: number;
	failures: FailureItem[];
};

// reportName is assigned once when the file is added and stays stable.
export type LoadedFileEntry = {
	id: string;
	file: File;
	baseReportName: string;
	reportName: string;
	visible: boolean;
	errorMessage: string | null;
};

export type ResultsWorkflowStatus = "idle" | "processing" | "ready" | "error";

export type ResultsWorkflowState = {
	status: ResultsWorkflowStatus;
	latestResult: AnalysisResult | null;
	latestDatasetLabel: string;
	batchStatus: BatchStatus | null;
	validationMessage: string | null;
	loadedFiles: LoadedFileEntry[];
};

export type ResultsWorkflowAction =
	| { type: "set_validation_message"; message: string | null }
	| { type: "set_loaded_files"; files: LoadedFileEntry[] }
	| { type: "toggle_file_visibility"; fileId: string }
	| { type: "reset_results" }
	| { type: "start_processing" }
	| {
			type: "complete_processing";
			batchStatus: BatchStatus;
			latestResult: AnalysisResult | null;
			latestDatasetLabel: string;
	  };
