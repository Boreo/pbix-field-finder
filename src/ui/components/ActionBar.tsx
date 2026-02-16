// src/ui/components/ActionBar.tsx
// Split-button: primary action (Export) + dropdown for alternate formats.
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, Download } from "lucide-react";
import { cn } from "../lib/cn";

type ActionBarProps = {
	disabled: boolean;
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
	onExportSummaryJson,
	onExportRawCsv,
	onExportDetailsJson,
}: ActionBarProps) {
	const actions: ExportMenuAction[] = [
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
				onClick={onExportSummaryJson}
				disabled={disabled}
				className={cn(
					"inline-flex h-9 cursor-pointer items-center gap-2 rounded-l-md border pl-3.5 pr-2.5 text-sm transition",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)",
					"disabled:cursor-not-allowed disabled:opacity-60",
					disabled ? mainDisabled : mainEnabled,
				)}
				aria-label="Export summary JSON"
				title="Export summary JSON"
			>
				<Download aria-hidden="true" className="h-4 w-4" />
				Export
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
					<ChevronDown aria-hidden="true" className="h-4 w-4" />
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
								onClick={action.onSelect}
							>
								{action.label}
							</button>
						</MenuItem>
					))}
				</MenuItems>
			</Menu>
		</div>
	);
}
