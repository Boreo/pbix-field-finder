// src/ui/components/ProcessingStatus.tsx
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ResultsWorkflowStatus } from "../features/results/workflow.types";

type ProcessingStatusProps = {
	status: ResultsWorkflowStatus;
	fileCount: number;
	fieldCount: number;
	tableCount: number;
	failureCount: number;
};

export function ProcessingStatus({
	status,
	fileCount,
	fieldCount,
	tableCount,
	failureCount,
}: ProcessingStatusProps) {
	if (status === "idle") {
		return null;
	}

	if (status === "processing") {
		return (
			<div className="flex items-center gap-2 px-1 text-sm text-(--app-fg-secondary)" role="status" aria-live="polite">
				<Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
				<span>Parsing {fileCount} {fileCount === 1 ? "file" : "files"}\u2026</span>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex items-center gap-2 px-1 text-sm text-(--app-fg-danger)" role="status" aria-live="assertive">
				<AlertCircle aria-hidden="true" className="h-4 w-4" />
				<span>Failed to process {fileCount === 1 ? "file" : "files"}</span>
			</div>
		);
	}

	if (failureCount > 0) {
		return (
			<div className="flex items-center gap-2 px-1 text-sm text-(--app-cta)" role="status" aria-live="polite">
				<AlertCircle aria-hidden="true" className="h-4 w-4" />
				<span>
					Ready &middot; {fieldCount} {fieldCount === 1 ? "field" : "fields"} across {tableCount}{" "}
					{tableCount === 1 ? "table" : "tables"} - with {failureCount}{" "}
					{failureCount === 1 ? "error" : "errors"}
				</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 px-1 text-sm text-(--app-fg-success)" role="status" aria-live="polite">
			<CheckCircle2 aria-hidden="true" className="h-4 w-4" />
			<span>
				Ready &middot; {fieldCount} {fieldCount === 1 ? "field" : "fields"} across {tableCount}{" "}
				{tableCount === 1 ? "table" : "tables"}
			</span>
		</div>
	);
}
