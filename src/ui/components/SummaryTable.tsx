// src/ui/components/SummaryTable.tsx
import { Rows2, Rows3 } from "lucide-react";
import type { SummaryRow } from "../../core/projections";
import { SummaryFilter } from "../features/results/components/SummaryFilter";
import { SummaryGrid } from "../features/results/components/SummaryGrid";
import { useSummaryTableState } from "../features/results/useSummaryTableState";
import type { TableDensity } from "../types";
import { ActionBar } from "./ActionBar";

type SummaryTableProps = {
	rows: SummaryRow[];
	density: TableDensity;
	onDensityChange: (density: TableDensity) => void;
	singleReportMode: boolean;
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	exportDisabled: boolean;
	onExportSummaryJson: () => void;
	onExportRawCsv: () => void;
	onExportDetailsJson: () => void;
};

export function SummaryTable({
	rows,
	density,
	onDensityChange,
	singleReportMode,
	globalFilter,
	onGlobalFilterChange,
	exportDisabled,
	onExportSummaryJson,
	onExportRawCsv,
	onExportDetailsJson,
}: SummaryTableProps) {
	const {
		sorting,
		setSorting,
		expandedRows,
		filteredRows,
		toggleRow,
		toggleReport,
		isRowExpanded,
		isReportExpanded,
	} = useSummaryTableState(rows, globalFilter);

	return (
		<section className="relative rounded-xl border border-ctp-surface2 bg-ctp-mantle px-3 pt-2 pb-3">
			<div className="flex flex-wrap items-end gap-2">
				<div className="mb-2">
					<SummaryFilter globalFilter={globalFilter} onGlobalFilterChange={onGlobalFilterChange} />
				</div>
				<div className="ml-auto mb-2 flex items-end justify-end">
					<ActionBar
						disabled={exportDisabled}
						onExportSummaryJson={onExportSummaryJson}
						onExportRawCsv={onExportRawCsv}
						onExportDetailsJson={onExportDetailsJson}
					/>
				</div>
			</div>
			<div>
				<div className="flex h-8 items-center justify-between -mb-px px-2">
					<p className="text-xs font-semibold leading-tight text-(--app-fg-primary)">Summary table</p>
					<div
						role="group"
						aria-label="Row spacing controls"
						className="z-0 inline-flex gap-0.5 rounded-t-md rounded-b-none border border-b-0 border-[color-mix(in_srgb,var(--color-ctp-overlay0)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-ctp-mantle)_76%,var(--color-ctp-base))] p-0.5 opacity-85"
					>
						<button
							type="button"
							onClick={() => onDensityChange("comfortable")}
							aria-label="Set row spacing to comfortable"
							title="Set row spacing to comfortable"
							aria-pressed={density === "comfortable"}
							className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) disabled:cursor-not-allowed ${
								density === "comfortable"
									? "border-[color-mix(in_srgb,var(--color-ctp-overlay1)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-ctp-overlay0)_14%,transparent)] text-(--app-fg-secondary)"
									: "border-transparent bg-transparent text-(--app-fg-muted) hover:border-[color-mix(in_srgb,var(--color-ctp-overlay0)_40%,transparent)] hover:text-(--app-fg-secondary)"
							}`}
						>
							<Rows2 aria-hidden="true" className="h-3.5 w-3.5" />
						</button>
						<button
							type="button"
							onClick={() => onDensityChange("compact")}
							aria-label="Set row spacing to compact"
							title="Set row spacing to compact"
							aria-pressed={density === "compact"}
							className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) disabled:cursor-not-allowed ${
								density === "compact"
									? "border-[color-mix(in_srgb,var(--color-ctp-overlay1)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-ctp-overlay0)_14%,transparent)] text-(--app-fg-secondary)"
									: "border-transparent bg-transparent text-(--app-fg-muted) hover:border-[color-mix(in_srgb,var(--color-ctp-overlay0)_40%,transparent)] hover:text-(--app-fg-secondary)"
							}`}
						>
							<Rows3 aria-hidden="true" className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>
				<div className="relative z-10">
					<SummaryGrid
						filteredRows={filteredRows}
						density={density}
						singleReportMode={singleReportMode}
						sorting={sorting}
						setSorting={setSorting}
						expandedRows={expandedRows}
						onToggleRow={toggleRow}
						isRowExpanded={isRowExpanded}
						onToggleReport={toggleReport}
						isReportExpanded={isReportExpanded}
					/>
				</div>
			</div>
		</section>
	);
}
