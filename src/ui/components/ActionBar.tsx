// src/ui/components/ActionBar.tsx
// Split-button: primary action (Export) + dropdown for alternate formats.
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, Download } from "lucide-react";
import { cn } from "../lib/cn";

type ActionBarProps = {
	disabled: boolean;
	onCopyRawCsv?: () => void;
	onExportSummaryJson: () => void;
	onExportRawCsv: () => void;
	onExportDetailsJson: () => void;
};

type ExportMenuAction = {
	id: string;
	label: string;
	title: string;
	onSelect: () => void;
};

type CopyFeedback = {
	id: number;
	x: number;
	y: number;
};

const mainEnabled =
	"border-transparent bg-(--app-cta) text-(--app-cta-text) font-semibold shadow-sm hover:brightness-110";
const mainDisabled =
	"border-(--app-border) bg-ctp-crust text-(--app-fg-secondary)";

const chevronEnabled =
	"border-transparent bg-(--app-cta) text-(--app-cta-text) shadow-sm hover:brightness-110";
const chevronDisabled =
	"border-(--app-border) border-l-(--app-border) bg-ctp-crust text-(--app-fg-secondary)";

/**
 * Render export actions as a primary button with a format dropdown menu.
 * @param props Action-bar props controlling disabled state and export handlers.
 * @param props.disabled Indicates whether export controls are interactable.
 * @param props.onExportSummaryJson Handles summary JSON export requests.
 * @param props.onExportRawCsv Handles raw CSV export requests.
 * @param props.onExportDetailsJson Handles details JSON export requests.
 * @returns Export controls for summary, raw CSV, and details downloads.
 */
export function ActionBar({
	disabled,
	onCopyRawCsv = () => {},
	onExportSummaryJson,
	onExportRawCsv,
	onExportDetailsJson,
}: ActionBarProps) {
	const [copyFeedbacks, setCopyFeedbacks] = useState<CopyFeedback[]>([]);
	const copyFeedbackIdRef = useRef(0);
	const copyFeedbackTimeoutsRef = useRef(new Map<number, number>());

	const removeCopyFeedback = useCallback((feedbackId: number) => {
		setCopyFeedbacks((current) => current.filter((feedback) => feedback.id !== feedbackId));
		const timeoutId = copyFeedbackTimeoutsRef.current.get(feedbackId);
		if (timeoutId !== undefined) {
			window.clearTimeout(timeoutId);
			copyFeedbackTimeoutsRef.current.delete(feedbackId);
		}
	}, []);

	const showCopyFeedback = useCallback(
		(x: number, y: number) => {
			const nextId = copyFeedbackIdRef.current + 1;
			copyFeedbackIdRef.current = nextId;
			setCopyFeedbacks((current) => [...current, { id: nextId, x, y }]);
			const timeoutId = window.setTimeout(() => removeCopyFeedback(nextId), 1500);
			copyFeedbackTimeoutsRef.current.set(nextId, timeoutId);
		},
		[removeCopyFeedback],
	);

	const onCopyRawCsvClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			onCopyRawCsv();
			const fallbackRect = event.currentTarget.getBoundingClientRect();
			const x = event.clientX || fallbackRect.left + fallbackRect.width / 2;
			const y = event.clientY || fallbackRect.top + fallbackRect.height / 2;
			showCopyFeedback(x, y);
		},
		[onCopyRawCsv, showCopyFeedback],
	);

	useEffect(() => {
		return () => {
			for (const timeoutId of copyFeedbackTimeoutsRef.current.values()) {
				window.clearTimeout(timeoutId);
			}
			copyFeedbackTimeoutsRef.current.clear();
		};
	}, []);

	const actions: ExportMenuAction[] = [
		{
			id: "copy-raw-csv",
			label: "Copy Raw CSV",
			title: "Copy the normalised field usage dataset as CSV to clipboard",
			onSelect: onCopyRawCsv,
		},
		{
			id: "raw-csv",
			label: "Export Raw CSV",
			title: "Download the normalised field usage dataset as CSV",
			onSelect: onExportRawCsv,
		},
		{
			id: "summary-json",
			label: "Export Summary JSON",
			title: "Download the grouped summary dataset as JSON",
			onSelect: onExportSummaryJson,
		},
		{
			id: "details-json",
			label: "Export Details JSON",
			title: "Download per-page field usage details as JSON",
			onSelect: onExportDetailsJson,
		},
	];

	return (
		<div className="relative z-120 inline-flex w-fit rounded-md shadow-sm">
			<button
				type="button"
				onClick={onExportRawCsv}
				disabled={disabled}
				className={cn(
					"inline-flex h-9 cursor-pointer items-center gap-2 rounded-l-md border pl-3.5 pr-2.5 text-sm transition",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)",
					"disabled:cursor-not-allowed disabled:opacity-60",
					disabled ? mainDisabled : mainEnabled,
				)}
				aria-label="Export raw CSV"
				title="Export raw CSV"
			>
				<Download aria-hidden="true" className="pbix-latte-brown-text h-4 w-4" />
				<span className="pbix-latte-brown-text">Export</span>
			</button>
			<Menu as="div" className="relative z-130">
				<MenuButton
					disabled={disabled}
					aria-haspopup="menu"
					className={cn(
						"inline-flex h-9 w-7 cursor-pointer items-center justify-center rounded-r-md border border-l-0 text-sm transition",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)",
						"disabled:cursor-not-allowed disabled:opacity-60",
						disabled ? chevronDisabled : chevronEnabled,
					)}
					aria-label="Open export menu"
					title="Open export menu"
				>
					<ChevronDown aria-hidden="true" className="pbix-latte-brown-text h-4 w-4" />
				</MenuButton>
				<MenuItems
					anchor="bottom end"
					className="z-140 min-w-52 rounded-md border border-(--app-border) bg-ctp-crust p-1 shadow-lg [--anchor-gap:4px]"
				>
					{actions.map((action) => (
						<MenuItem key={action.id}>
							<button
								type="button"
								className="flex w-full cursor-pointer items-center rounded px-3 py-2 text-left text-sm text-(--app-fg-primary) data-focus:bg-ctp-surface0 data-focus:text-(--app-fg-accent-text)"
								title={action.title}
								onClick={action.id === "copy-raw-csv" ? onCopyRawCsvClick : action.onSelect}
							>
								{action.label}
							</button>
						</MenuItem>
					))}
				</MenuItems>
			</Menu>
			<div className="pointer-events-none fixed inset-0 z-150">
				{copyFeedbacks.map((feedback) => (
					<div
						key={feedback.id}
						className="pbix-copy-feedback pointer-events-none fixed rounded border border-ctp-surface2 bg-ctp-surface0 px-2 py-1 text-xs font-semibold text-(--app-fg-primary) shadow-md"
						style={{
							left: `${feedback.x + 8}px`,
							top: `${feedback.y - 12}px`,
						}}
					>
						Copied to clipboard
					</div>
				))}
			</div>
		</div>
	);
}
