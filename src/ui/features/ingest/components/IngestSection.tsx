// src/ui/features/ingest/components/IngestSection.tsx
// Shows FileDropzone when empty, swaps to FilesStrip once files are loaded.
import { FileDropzone } from "../../../components/FileDropzone";
import { FilesStrip } from "../../../components/FilesStrip";
import type { LoadedFileEntry } from "../../results/workflow.types";

type IngestSectionProps = {
	loadedFiles: LoadedFileEntry[];
	isProcessing: boolean;
	validationMessage: string | null;
	onFilesAccepted: (files: File[]) => void;
	onRemoveFile: (fileId: string) => void;
	onClearFiles: () => void;
	onToggleFileVisibility: (fileId: string) => void;
	onValidationError: (message: string | null) => void;
};

/**
 * Render the ingestion section for file selection, validation, and queue visibility controls.
 * @param props Ingestion-section props controlling loaded files and interaction handlers.
 * @param props.loadedFiles Current list of files loaded into the workflow.
 * @param props.isProcessing Indicates whether file processing is currently running.
 * @param props.validationMessage Validation error text to display for unsupported files.
 * @param props.onFilesAccepted Accepts newly selected supported files.
 * @param props.onRemoveFile Removes a single file from the current list.
 * @param props.onClearFiles Removes all files from the current list.
 * @param props.onToggleFileVisibility Toggles whether a file participates in results.
 * @param props.onValidationError Sets or clears validation messaging in the parent workflow.
 * @returns The ingestion panel with either an empty-state dropzone or loaded-file strip.
 */
export function IngestSection({
	loadedFiles,
	isProcessing,
	validationMessage,
	onFilesAccepted,
	onRemoveFile,
	onClearFiles,
	onToggleFileVisibility,
	onValidationError,
}: IngestSectionProps) {
	return (
		<section className="space-y-3 rounded-xl border border-ctp-surface2 bg-ctp-crust p-4">
			{loadedFiles.length === 0 ? (
				<>
					{/* Section: Empty-state dropzone */}
					<FileDropzone
						disabled={isProcessing}
						onFilesAccepted={onFilesAccepted}
						onValidationError={onValidationError}
					/>
				</>
			) : (
				<>
					{/* Section: Loaded-file strip */}
					<FilesStrip
						files={loadedFiles}
						disabled={isProcessing}
						onAddFiles={onFilesAccepted}
						onRemoveFile={onRemoveFile}
						onClearFiles={onClearFiles}
						onToggleFileVisibility={onToggleFileVisibility}
						onValidationError={onValidationError}
					/>
				</>
			)}
			{isProcessing ? (
				<p className="text-sm text-(--app-fg-secondary)" role="status">
					Processing files...
				</p>
			) : null}
			{validationMessage ? (
				<p className="text-sm text-(--app-fg-danger)" role="alert">
					{validationMessage}
				</p>
			) : null}
		</section>
	);
}
