// src/ui/components/FilesStrip.tsx
import { useRef, type ChangeEvent } from "react";
import { Eye, EyeOff, Trash2, Upload, X } from "lucide-react";
import { buildUnsupportedFilesMessage, splitSupportedPbixFiles } from "../features/ingest/file-selection";
import { useFileDropTarget } from "../features/ingest/useFileDropTarget";
import { cn } from "../lib/cn";
import { Button, Chip, IconButton, Panel } from "../primitives";

type LoadedFile = {
	id: string;
	file: File;
	visible: boolean;
	errorMessage: string | null;
};

type FilesStripProps = {
	files: LoadedFile[];
	disabled?: boolean;
	onAddFiles: (files: File[]) => void;
	onRemoveFile: (fileId: string) => void;
	onClearFiles: () => void;
	onToggleFileVisibility: (fileId: string) => void;
	onValidationError?: (message: string) => void;
};

/**
 * Render the loaded-file strip with visibility and removal controls.
 * @param props Files-strip props controlling file list state and file-management handlers.
 * @param props.files Loaded files with visibility and per-file error state.
 * @param props.disabled Disables interactive controls while processing is active.
 * @param props.onAddFiles Receives additional supported files from picker or drag-and-drop.
 * @param props.onRemoveFile Removes a single file by stable entry id.
 * @param props.onClearFiles Removes all loaded files.
 * @param props.onToggleFileVisibility Toggles whether a file contributes to projections.
 * @param props.onValidationError Receives a message for rejected file extensions.
 * @returns A compact file-list panel with add, remove, clear, and visibility actions.
 */
export function FilesStrip({
	files,
	disabled = false,
	onAddFiles,
	onRemoveFile,
	onClearFiles,
	onToggleFileVisibility,
	onValidationError,
}: FilesStripProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const singleFileMode = files.length === 1;
	const shouldShowVisibilityToggle = files.length > 1;
	const visibleCount = files.filter((file) => file.visible).length;
	const isLastVisible = visibleCount <= 1;

	const handleSelectedFiles = (filesToHandle: File[]) => {
		const { accepted, rejected } = splitSupportedPbixFiles(filesToHandle);
		if (rejected.length > 0) {
			onValidationError?.(buildUnsupportedFilesMessage(rejected));
		}
		if (accepted.length > 0) {
			onAddFiles(accepted);
		}
	};

	const { dragActive, onDragEnter, onDragLeave, onDragOver, onDrop } = useFileDropTarget({
		disabled,
		onFilesDropped: handleSelectedFiles,
	});

	const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const selected = Array.from(event.target.files ?? []);
		if (selected.length > 0) {
			handleSelectedFiles(selected);
		}
		event.target.value = "";
	};

	const countLabel = (() => {
		if (visibleCount < files.length) {
			return `${visibleCount} visible \u00b7 ${files.length} total`;
		}
		return `${files.length} file${files.length === 1 ? "" : "s"}`;
	})();

	// Section: File strip panel.
	return (
		<Panel
			className={cn(
				"transition-colors",
				dragActive
					? "border-(--app-cta) bg-[color-mix(in_srgb,var(--app-cta)_12%,var(--color-ctp-surface0))]"
					: "bg-ctp-surface0",
			)}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
			onDrop={onDrop}
			aria-live="polite"
		>
			<input
				ref={fileInputRef}
				type="file"
				accept=".pbix,.zip"
				multiple
				className="sr-only"
				onChange={onInputChange}
				disabled={disabled}
				aria-label="Add PBIX files"
			/>
			<div className="space-y-1.5">
				<div className="flex flex-wrap items-center gap-1.5">
					<h2 className="text-xs font-semibold leading-tight text-(--app-fg-primary)">
						Files · {dragActive ? "Drop to add" : countLabel}
					</h2>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex flex-1 flex-wrap gap-1.5">
						{/* Section: Loaded file chips */}
						{files.map((item) => (
							<Chip
								key={item.id}
								className={cn(
									"pl-2 pr-1 text-(--app-fg-primary)",
									singleFileMode && "pl-3 pr-1.5 py-1.5 text-sm",
									!item.visible && "opacity-50",
									item.errorMessage
										? "border-ctp-red bg-[color-mix(in_srgb,var(--color-ctp-red)_14%,var(--color-ctp-surface0))] text-(--app-fg-danger)"
										: "border-[color-mix(in_srgb,var(--color-ctp-green)_52%,var(--app-border))] bg-ctp-surface0",
								)}
							>
								{/* Section: Visibility toggle */}
								{shouldShowVisibilityToggle && !item.errorMessage ? (
									<IconButton
										variant="ghost"
										size="sm"
										onClick={() => onToggleFileVisibility(item.id)}
										disabled={disabled || (item.visible && isLastVisible)}
										aria-label={item.visible ? `Hide ${item.file.name}` : `Show ${item.file.name}`}
										aria-pressed={!item.visible}
										title={
											item.visible
												? `Exclude ${item.file.name} from results`
												: `Include ${item.file.name} in results`
										}
									>
										{item.visible ? (
											<Eye aria-hidden="true" className="h-3.5 w-3.5" />
										) : (
											<EyeOff aria-hidden="true" className="h-3.5 w-3.5" />
										)}
									</IconButton>
								) : null}
								<span
									className={cn("truncate", (!item.visible || item.errorMessage) && "line-through")}
									title={item.errorMessage ?? item.file.name}
								>
									{item.file.name}
								</span>
								{/* Section: Remove file action */}
								<IconButton
									variant="danger"
									size="sm"
									onClick={() => onRemoveFile(item.id)}
									disabled={disabled}
									aria-label={`Remove ${item.file.name}`}
									title={`Remove ${item.file.name} from the current file list`}
								>
									<X aria-hidden="true" className="h-3.5 w-3.5" />
								</IconButton>
							</Chip>
						))}
					</div>
					{/* Section: Add files action */}
					<Button
						variant="secondary"
						onClick={() => fileInputRef.current?.click()}
						disabled={disabled}
						title="Add more PBIX files to the current list"
					>
						<Upload aria-hidden="true" className="h-4 w-4" />
						Add files
					</Button>
					{/* Section: Clear files action */}
					{!singleFileMode ? (
						<Button
							variant="danger"
							onClick={onClearFiles}
							disabled={disabled}
							title="Remove all files from the current list"
						>
							<Trash2 aria-hidden="true" className="h-4 w-4" />
							Clear all
						</Button>
					) : null}
				</div>

			</div>
		</Panel>
	);
}
