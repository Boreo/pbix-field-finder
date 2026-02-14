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
				<FileDropzone
					disabled={isProcessing}
					onFilesAccepted={onFilesAccepted}
					onValidationError={onValidationError}
				/>
			) : (
				<FilesStrip
					files={loadedFiles}
					disabled={isProcessing}
					onAddFiles={onFilesAccepted}
					onRemoveFile={onRemoveFile}
					onClearFiles={onClearFiles}
					onToggleFileVisibility={onToggleFileVisibility}
					onValidationError={onValidationError}
				/>
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
