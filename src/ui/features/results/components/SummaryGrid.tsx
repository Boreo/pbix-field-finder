// src/ui/features/results/components/SummaryGrid.tsx
import { Fragment, useCallback, useMemo, type Dispatch, type SetStateAction } from "react";

import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type SortingState,
} from "@tanstack/react-table";
import type { CanonicalUsageRow, SummaryRow } from "../../../../core/projections";
import { createSummaryColumns } from "../summaryTable.columns";
import { ReportBreakdown } from "./ReportBreakdown";
import type { TableDensity } from "../../../types";
import { sortIcon, toAriaSort, zebraRowClass } from "../table.utils";
import { EmptyFilterRow } from "./EmptyFilterRow";

type SummaryGridProps = {
	filteredRows: SummaryRow[];
	canonicalUsages: CanonicalUsageRow[];
	density: TableDensity;
	singleReportMode: boolean;
	globalFilter: string;
	onClearGlobalFilter: () => void;
	sorting: SortingState;
	setSorting: Dispatch<SetStateAction<SortingState>>;
	expandedRows: Record<string, boolean>;
	onToggleRow: (rowId: string) => void;
	isRowExpanded: (rowId: string) => boolean;
	onApplySummaryFilter: (value: string) => void;
};

/**
 * Render the sortable summary grid with expandable breakdown rows.
 * @param props Grid props with filtered rows, sort state, density, and expansion handlers.
 * @param props.filteredRows Summary rows after filter application.
 * @param props.canonicalUsages Canonical usage rows for visual-level breakdown details.
 * @param props.density Row-density mode used for table spacing classes.
 * @param props.singleReportMode Indicates whether breakdown rows should hide Report column.
 * @param props.globalFilter Current summary filter query used to render empty-state guidance.
 * @param props.onClearGlobalFilter Clears the active summary filter from empty-state actions.
 * @param props.sorting Current TanStack sorting state.
 * @param props.setSorting Updates TanStack sorting state.
 * @param props.expandedRows Expansion state keyed by summary row id.
 * @param props.onToggleRow Toggles expansion for one summary row.
 * @param props.isRowExpanded Returns whether a summary row is expanded.
 * @returns A summary table with sortable headers and expandable tabbed breakdown rows.
 */
export function SummaryGrid({
	filteredRows,
	canonicalUsages,
	density,
	singleReportMode,
	globalFilter,
	onClearGlobalFilter,
	sorting,
	setSorting,
	expandedRows,
	onToggleRow,
	isRowExpanded,
	onApplySummaryFilter,
}: SummaryGridProps) {
	const onSelectTable = useCallback(
		(summaryRow: SummaryRow) => {
			onApplySummaryFilter(summaryRow.table);
		},
		[onApplySummaryFilter],
	);

	const columns = useMemo(
		() => createSummaryColumns({ expandedRows, onToggleRow, onSelectTable, singleReportMode }),
		[expandedRows, onSelectTable, onToggleRow, singleReportMode],
	);

	const table = useReactTable({
		data: filteredRows,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const gridBorderClass = "border-(--app-border)"; // Solid border for 3:1 contrast
	const densityClass = density === "compact" ? "text-xs" : "text-sm";
	const cellPaddingClass = density === "compact" ? "px-3 py-1.5" : "px-3 py-2.5";
	const hasActiveFilter = globalFilter.trim().length > 0;

	return (
		<div className={`overflow-auto rounded-lg border ${gridBorderClass}`}>
			<table className={`min-w-max w-full border-collapse table-auto tabular-nums ${densityClass}`}>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="bg-ctp-surface1">
							{headerGroup.headers.map((header, index) => {
								const sorted = header.column.getIsSorted();
								const isFirstColumn = index === 0;
								return (
									<th
										key={header.id}
										scope="col"
										aria-sort={toAriaSort(sorted)}
										className={`sticky top-0 select-text border ${gridBorderClass} bg-ctp-surface1 ${cellPaddingClass} font-semibold text-(--app-fg-primary) ${
											isFirstColumn ? "z-30 text-left" : "z-30 text-right"
										}`}
									>
										{header.isPlaceholder ? null : (
											<button
												type="button"
												onClick={header.column.getToggleSortingHandler()}
												className={`inline-flex w-full select-text items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) ${
													isFirstColumn ? "justify-start" : "justify-end"
												}`}
												aria-label={`Sort by ${header.column.id}`}
											>
												<span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
												<span className="inline-block w-4 text-center text-xs text-(--app-fg-muted)">
													{sortIcon(sorted)}
												</span>
											</button>
										)}
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.length === 0 ? (
						<EmptyFilterRow
							colSpan={table.getAllColumns().length}
							borderClass={gridBorderClass}
							paddingClass={cellPaddingClass}
							hasFilterNoMatches={hasActiveFilter}
							filterMessage={`No summary rows match filter "${globalFilter}".`}
							onClearFilter={onClearGlobalFilter}
							fallbackMessage="No summary rows match the current filter."
							cellClassName="text-(--app-fg-muted)"
						/>
					) : (
						table.getRowModel().rows.map((row, rowIndex) => {
							const summaryRow = row.original;
							const isExpanded = isRowExpanded(summaryRow.id);
							const zebraClass = zebraRowClass(rowIndex);
							const zebraHoverClass =
								rowIndex % 2 === 0
									? "hover:bg-[color-mix(in_srgb,var(--app-accent)_10%,var(--app-zebra-row-first))]"
									: "hover:bg-[color-mix(in_srgb,var(--app-accent)_10%,var(--app-zebra-row-second))]";
							return (
								<Fragment key={row.id}>
									<tr
										className={`group ${zebraClass} ${zebraHoverClass} transition-colors`}
										onDoubleClick={(event) => {
											const target = event.target as HTMLElement | null;
											if (target?.closest("button")) {
												return;
											}
											onToggleRow(summaryRow.id);
										}}
									>
										{row.getVisibleCells().map((cell, index) =>
											index === 0 ? (
												<th
													key={cell.id}
													scope="row"
													className={`border ${gridBorderClass} ${cellPaddingClass} text-left`}
												>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</th>
											) : (
												<td key={cell.id} className={`border ${gridBorderClass} ${cellPaddingClass} text-right`}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											),
										)}
									</tr>
									{isExpanded ? (
										<tr className="bg-ctp-mantle">
											<td
												colSpan={table.getAllColumns().length}
												className={`border ${gridBorderClass} ${cellPaddingClass} bg-ctp-mantle`}
											>
												{/* Section: Report breakdown */}
												<ReportBreakdown
													summaryRow={summaryRow}
													allCanonicalUsages={canonicalUsages}
													density={density}
													singleReportMode={singleReportMode}
													gridBorderClass={gridBorderClass}
												/>
											</td>
										</tr>
									) : null}
								</Fragment>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}
