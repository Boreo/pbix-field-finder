// src/ui/features/ingest/components/FileDropzone.tsx
import { useRef, type ChangeEvent } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/ui/design-system";
import { cn } from "@/ui/shared";
import { useFileDropTarget } from "../hooks/useFileDropTarget";
import { buildUnsupportedFilesMessage, splitSupportedPbixFiles } from "../utils/fileSelection";

type FileDropzoneProps = {
	disabled?: boolean;
	onFilesAccepted: (files: File[]) => void;
	onValidationError?: (message: string) => void;
};

/**
 * Render the empty-state dropzone for selecting or dropping PBIX files.
 * @param props Dropzone props controlling disabled state and file-validation callbacks.
 * @param props.disabled Disables drag, keyboard, and click interactions when true.
 * @param props.onFilesAccepted Receives supported `.pbix` or `.zip` files after validation.
 * @param props.onValidationError Receives an aggregated message for unsupported files when present.
 * @returns An interactive file dropzone and picker control.
 */
export function FileDropzone({ disabled = false, onFilesAccepted, onValidationError }: FileDropzoneProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleFiles = (files: File[]) => {
		const { accepted, rejected } = splitSupportedPbixFiles(files);
		if (rejected.length > 0) {
			onValidationError?.(buildUnsupportedFilesMessage(rejected));
		}
		if (accepted.length > 0) {
			onFilesAccepted(accepted);
		}
	};

	const { dragActive, onDragEnter, onDragLeave, onDragOver, onDrop } = useFileDropTarget({
		disabled,
		onFilesDropped: handleFiles,
	});

	const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files ?? []);
		if (files.length > 0) {
			handleFiles(files);
		}
		// Reset so re-selecting the same file still fires onChange.
		event.target.value = "";
	};

	const openFileDialog = () => {
		if (disabled) {
			return;
		}
		fileInputRef.current?.click();
	};

	const descriptionId = "file-dropzone-description";

	return (
		<div
			className={cn(
				"flex min-h-[50vh] flex-col items-center justify-center rounded-xl border-2 border-dashed transition",
				dragActive
					? "border-(--app-accent-blue) bg-(--app-fill-hover)"
					: "border-(--app-stroke) bg-(--app-surface-0)",
				disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
			)}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
			onDrop={onDrop}
			onClick={openFileDialog}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					openFileDialog();
				}
			}}
			role="button"
			tabIndex={disabled ? -1 : 0}
			aria-disabled={disabled}
			aria-describedby={descriptionId}
			aria-label="PBIX file dropzone"
		>
			<input
				ref={fileInputRef}
				type="file"
				accept=".pbix,.zip"
				multiple
				className="sr-only"
				onChange={onInputChange}
				disabled={disabled}
				aria-label="Upload PBIX files"
			/>
			<div className="flex flex-col items-center gap-4 text-center">
				<UploadCloud
					aria-hidden="true"
					className={cn(
						"h-12 w-12 transition-colors",
						dragActive ? "text-(--app-link)" : "text-(--app-fg-muted)",
					)}
				/>
				<div className="space-y-1">
					<p className="text-base font-medium text-(--app-fg-primary)">
						{dragActive ? "Drop files here" : "Drop PBIX files here"}
					</p>
					<p className="text-sm text-(--app-fg-muted)">or</p>
				</div>
				{/* Section: Primary file picker action */}
				<Button
					variant="cta"
					className="h-20 w-82.5 max-w-full justify-center text-[24px] leading-tight font-semibold"
					onClick={(event) => {
						event.stopPropagation();
						openFileDialog();
					}}
					disabled={disabled}
					tabIndex={-1}
				>
					Select Power BI files
				</Button>
				<p id={descriptionId} className="text-xs text-(--app-fg-muted)">
					Accepts .pbix and .zip files
				</p>
			</div>
		</div>
	);
}
