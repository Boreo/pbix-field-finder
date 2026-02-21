// src/ui/features/results/components/SummaryGrid.tsx
import { Fragment, useMemo, type Dispatch, type SetStateAction } from "react";

import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type SortingState,
} from "@tanstack/react-table";
import type { CanonicalUsageRow, SummaryRow } from "@/core/projections";
import type { TableDensity } from "@/ui/shared";
import { EmptyFilterRow } from "../../components/EmptyFilterRow";
import { sortIcon, toAriaSort, zebraRowClass } from "../../components/tablePresentation";
import { ReportBreakdown } from "../../breakdown/components/ReportBreakdown";
import { createSummaryColumns } from "../summaryColumns";

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
}: SummaryGridProps) {
	const columns = useMemo(
		() => createSummaryColumns({ expandedRows, onToggleRow, singleReportMode }),
		[expandedRows, onToggleRow, singleReportMode],
	);

	const table = useReactTable({
		data: filteredRows,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const gridBorderClass = "border-(--app-stroke)"; // Solid border for 3:1 contrast
	const densityClass = density === "compact" ? "text-xs" : "text-sm";
	const cellPaddingClass = density === "compact" ? "px-3 py-1.5" : "px-3 py-2.5";
	const hasActiveFilter = globalFilter.trim().length > 0;
	const rightAlignedColumnIds = new Set(["totalUses", "reportCount", "pageCount", "visualCount", "hiddenOnly", "kind"]);
	const centeredColumnIds = new Set<string>();
	const columnWidthClassById: Partial<Record<string, string>> = {
		reportCount: "w-[100px] max-w-[110px]",
		totalUses: "w-[100px] max-w-[110px]",
		pageCount: "w-[100px] max-w-[110px]",
		visualCount: "w-[100px] max-w-[110px]",
		hiddenOnly: "w-[120px] max-w-[120px]",
		kind: "w-[144px] max-w-[160px]",
	};
	const nowrapColumnIds = new Set([
		"reportCount",
		"totalUses",
		"pageCount",
		"visualCount",
		"hiddenOnly",
		"kind",
	]);

	return (
		<div className={`overflow-auto rounded-lg border ${gridBorderClass}`}>
			<table className={`w-full border-collapse table-auto tabular-nums ${densityClass}`}>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="bg-(--app-surface-2)">
							{headerGroup.headers.map((header) => {
								const columnId = header.column.id;
								const sorted = header.column.getIsSorted();
								const isRightAligned = rightAlignedColumnIds.has(columnId);
								const isCentered = centeredColumnIds.has(columnId);
								const alignmentClass = isCentered ? "text-center" : isRightAligned ? "text-right" : "text-left";
								const justifyClass = isCentered ? "justify-center" : isRightAligned ? "justify-end" : "justify-start";
								const widthClass = columnId === "field" ? "w-auto" : (columnWidthClassById[columnId] ?? "");
								const nowrapClass = nowrapColumnIds.has(columnId) ? "whitespace-nowrap" : "";
								return (
									<th
										key={header.id}
										scope="col"
										aria-sort={toAriaSort(sorted)}
										className={`sticky top-0 z-30 select-text border ${gridBorderClass} bg-(--app-surface-2) p-0 font-semibold text-(--app-fg-primary) ${alignmentClass} ${widthClass} ${nowrapClass}`}
									>
										{header.isPlaceholder ? null : (
											<button
												type="button"
												onClick={header.column.getToggleSortingHandler()}
												className={`group flex h-full w-full select-text items-center gap-1 ${cellPaddingClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) ${justifyClass}`}
												aria-label={`Sort by ${columnId}`}
											>
												<span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
												<span
													className={`inline-block w-4 text-center text-xs text-(--app-fg-muted) transition-opacity ${
														sorted ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
													}`}
												>
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
							const zebraHoverClass = "hover:bg-(--app-fill-hover)";
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
										{row.getVisibleCells().map((cell, index) => {
											const columnId = cell.column.id;
											const isRightAligned = rightAlignedColumnIds.has(columnId);
											const isCentered = centeredColumnIds.has(columnId);
											const alignmentClass = isCentered ? "text-center" : isRightAligned ? "text-right" : "text-left";
											const widthClass = columnId === "field" ? "w-auto" : (columnWidthClassById[columnId] ?? "");
											const nowrapClass = nowrapColumnIds.has(columnId) ? "whitespace-nowrap" : "";
											return index === 0 ? (
												<th
													key={cell.id}
													scope="row"
													className={`border ${gridBorderClass} ${cellPaddingClass} ${alignmentClass} ${widthClass} ${nowrapClass}`}
												>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</th>
											) : (
												<td
													key={cell.id}
													className={`border ${gridBorderClass} ${cellPaddingClass} ${alignmentClass} ${widthClass} ${nowrapClass}`}
												>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											);
										})}
									</tr>
									{isExpanded ? (
										<tr>
											<td
												colSpan={table.getAllColumns().length}
												className={`border-t ${gridBorderClass} ${cellPaddingClass}`}
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

