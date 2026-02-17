// src/ui/components/SummaryTable.tsx
import { Rows2, Rows3 } from "lucide-react";
import { useCallback, useRef } from "react";
import type { CanonicalUsageRow, SummaryRow } from "../../core/projections";
import { SummaryFilter } from "../features/results/components/SummaryFilter";
import { SummaryGrid } from "../features/results/components/SummaryGrid";
import { useSummaryTableState } from "../features/results/useSummaryTableState";
import type { TableDensity } from "../types";
import { ToggleGroup } from "../primitives";
import { ActionBar } from "./ActionBar";

type SummaryTableProps = {
	rows: SummaryRow[];
	canonicalUsages: CanonicalUsageRow[];
	density: TableDensity;
	onDensityChange: (density: TableDensity) => void;
	singleReportMode: boolean;
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	exportDisabled: boolean;
	onCopyRawCsv?: () => void;
	onExportSummaryJson: () => void;
	onExportRawCsv: () => void;
	onExportDetailsJson: () => void;
};

/**
 * Render the summary table shell with filtering, export actions, and density controls.
 * @param props Summary-table props containing rows, filters, and export handlers.
 * @param props.rows Summary rows currently available for display.
 * @param props.canonicalUsages Canonical usage rows for visual-level breakdown details.
 * @param props.density Active row-density mode for compact or comfortable spacing.
 * @param props.onDensityChange Updates the selected table density mode.
 * @param props.singleReportMode Indicates whether report-count columns should be hidden.
 * @param props.globalFilter Current free-text filter string.
 * @param props.onGlobalFilterChange Updates the free-text summary filter.
 * @param props.exportDisabled Disables export actions when no exportable rows are available.
 * @param props.onExportSummaryJson Exports grouped summary rows as JSON.
 * @param props.onExportRawCsv Exports normalised raw usage rows as CSV.
 * @param props.onExportDetailsJson Exports projected detail rows as JSON.
 * @returns The summary results section used by the main results view.
 */
export function SummaryTable({
	rows,
	canonicalUsages,
	density,
	onDensityChange,
	singleReportMode,
	globalFilter,
	onGlobalFilterChange,
	exportDisabled,
	onCopyRawCsv,
	onExportSummaryJson,
	onExportRawCsv,
	onExportDetailsJson,
}: SummaryTableProps) {
	const summaryFilterInputRef = useRef<HTMLInputElement | null>(null);
	const {
		sorting,
		setSorting,
		expandedRows,
		filteredRows,
		toggleRow,
		isRowExpanded,
	} = useSummaryTableState(rows, globalFilter);

	const applySummaryFilter = useCallback(
		(value: string) => {
			onGlobalFilterChange(value);
			const focusSummaryFilter = () => {
				const node = summaryFilterInputRef.current;
				if (!node) {
					return;
				}
				node.focus();
				node.select();
			};
			if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
				window.requestAnimationFrame(focusSummaryFilter);
				return;
			}
			window.setTimeout(focusSummaryFilter, 0);
		},
		[onGlobalFilterChange],
	);

	return (
		<section className="relative rounded-xl border border-ctp-surface2 bg-ctp-mantle px-3 pt-2 pb-3">
			<div className="flex flex-wrap items-end gap-2">
				<div className="mb-2">
					{/* Section: Summary filter input */}
					<SummaryFilter
						globalFilter={globalFilter}
						onGlobalFilterChange={onGlobalFilterChange}
						inputRef={summaryFilterInputRef}
					/>
				</div>
				<div className="ml-auto mb-2 flex items-end justify-end">
					{/* Section: Export actions */}
					<ActionBar
						disabled={exportDisabled}
						onCopyRawCsv={onCopyRawCsv}
						onExportSummaryJson={onExportSummaryJson}
						onExportRawCsv={onExportRawCsv}
						onExportDetailsJson={onExportDetailsJson}
					/>
				</div>
			</div>
			<div>
				<div className="flex h-8 items-center justify-between -mb-px px-2">
					<p className="text-xs font-semibold leading-tight text-(--app-fg-primary)">Summary table</p>
					<ToggleGroup aria-label="Row spacing controls" value={density} onChange={onDensityChange} variant="pill">
						<ToggleGroup.Button
							value="comfortable"
							selected={density === "comfortable"}
							onSelect={onDensityChange}
							aria-label="Set row spacing to comfortable"
							title="Set row spacing to comfortable"
							variant="pill"
						>
							<Rows2 aria-hidden="true" className="h-3.5 w-3.5" />
						</ToggleGroup.Button>
						<ToggleGroup.Button
							value="compact"
							selected={density === "compact"}
							onSelect={onDensityChange}
							aria-label="Set row spacing to compact"
							title="Set row spacing to compact"
							variant="pill"
						>
							<Rows3 aria-hidden="true" className="h-3.5 w-3.5" />
						</ToggleGroup.Button>
					</ToggleGroup>
				</div>
				<div className="relative z-10">
					{/* Section: Summary data grid */}
					<SummaryGrid
						filteredRows={filteredRows}
						canonicalUsages={canonicalUsages}
						density={density}
						singleReportMode={singleReportMode}
						globalFilter={globalFilter}
						onClearGlobalFilter={() => onGlobalFilterChange("")}
						sorting={sorting}
						setSorting={setSorting}
						expandedRows={expandedRows}
						onToggleRow={toggleRow}
						isRowExpanded={isRowExpanded}
						onApplySummaryFilter={applySummaryFilter}
					/>
				</div>
			</div>
		</section>
	);
}
