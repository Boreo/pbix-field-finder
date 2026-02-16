// src/ui/features/results/components/ReportBreakdown.tsx
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Lock, LockOpen, Search } from "lucide-react";
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type SortingState,
} from "@tanstack/react-table";
import type { CanonicalUsageRow, SummaryRow } from "../../../../core/projections";
import type { TableDensity } from "../../../types";
import { Chip } from "../../../primitives/Chip";
import { useBreakdownRows, type PageBreakdownRow, type VisualBreakdownRow } from "../useBreakdownRows";
import { useBreakdownState } from "../useBreakdownState";

type ReportBreakdownProps = {
	summaryRow: SummaryRow;
	allCanonicalUsages: CanonicalUsageRow[];
	density: TableDensity;
	singleReportMode: boolean;
	gridBorderClass: string;
};

function zebraRowClass(index: number) {
	return index % 2 === 0 ? "bg-[var(--app-zebra-row-first)]" : "bg-[var(--app-zebra-row-second)]";
}

function sortIcon(sortState: false | "asc" | "desc") {
	if (sortState === "asc") return <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />;
	if (sortState === "desc") return <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />;
	return <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />;
}

function toAriaSort(sortState: false | "asc" | "desc"): "none" | "ascending" | "descending" {
	if (sortState === "asc") return "ascending";
	if (sortState === "desc") return "descending";
	return "none";
}

/**
 * Render expanded report/page breakdown with tabbed interface (Pages | Visuals).
 * @param props Breakdown props controlling data, styling, and density.
 * @param props.summaryRow Summary row whose usage details are displayed.
 * @param props.allCanonicalUsages All canonical usage rows for deriving visual-level breakdowns.
 * @param props.density Row-density mode for table spacing.
 * @param props.singleReportMode Indicates whether to hide Report column.
 * @param props.gridBorderClass Shared border class for consistent styling.
 * @returns A tabbed breakdown table for the selected summary row.
 */
export function ReportBreakdown({
	summaryRow,
	allCanonicalUsages,
	density,
	singleReportMode,
	gridBorderClass,
}: ReportBreakdownProps) {
	const {
		activeTab,
		setActiveTab,
		searchLocked,
		query,
		setQuery,
		toggleLock,
		clearGlobal,
		queryPlaceholder,
		queryAriaLabel,
	} = useBreakdownState();

	const { filteredPageRows, filteredVisualRows } = useBreakdownRows({
		summaryRow,
		allCanonicalUsages,
		singleReportMode,
		query,
	});

	return (
		<div className="ml-2 space-y-2 rounded-md border border-ctp-surface2 bg-ctp-surface0 p-2">
			<div className="flex items-center justify-between gap-2 rounded-md bg-ctp-mantle  px-2 py-1.5">
				<div
					role="group"
					aria-label="Breakdown view"
					className="inline-flex gap-0.5 rounded-md border border-ctp-surface2 bg-ctp-surface0 p-0.5"
				>
					<button
						type="button"
						onClick={() => setActiveTab("pages")}
						aria-pressed={activeTab === "pages"}
						className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
							activeTab === "pages"
								? "bg-ctp-surface1 text-(--app-fg-accent-text)"
								: "text-(--app-fg-secondary) hover:text-(--app-fg-accent-text)"
						}`}
					>
						Pages
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("visuals")}
						aria-pressed={activeTab === "visuals"}
						className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
							activeTab === "visuals"
								? "bg-ctp-surface1 text-(--app-fg-accent-text)"
								: "text-(--app-fg-secondary) hover:text-(--app-fg-accent-text)"
						}`}
					>
						Visuals
					</button>
				</div>

				<div className="flex flex-col items-end gap-1">
					<div className="flex items-center gap-1">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--app-fg-muted)" />
							<input
								type="text"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder={queryPlaceholder}
								aria-label={queryAriaLabel}
								className="h-7 w-48 rounded border border-ctp-surface2 bg-ctp-base pl-7 pr-2 text-xs text-(--app-fg-primary) placeholder:text-(--app-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--app-focus-ring)"
							/>
						</div>
						<button
							type="button"
							onClick={toggleLock}
							aria-label={searchLocked ? "Unlock global breakdown filter" : "Lock global breakdown filter"}
							title={searchLocked ? "Unlock search (keeps current query local)" : "Lock search (applies to all fields)"}
							className={`flex h-7 w-7 items-center justify-center rounded border transition-colors ${
								searchLocked
									? "border-ctp-surface2 bg-ctp-surface1 text-(--app-fg-accent-text)"
									: "border-ctp-surface2 bg-ctp-base text-(--app-fg-muted) hover:text-(--app-fg-secondary)"
							}`}
						>
							{searchLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
						</button>
					</div>
				</div>
			</div>

			{activeTab === "pages" ? (
				<PagesTable
					rows={filteredPageRows}
					singleReportMode={singleReportMode}
					gridBorderClass={gridBorderClass}
					density={density}
					searchLocked={searchLocked}
					activeSearchQuery={query}
					onClearGlobalFilter={clearGlobal}
				/>
			) : (
				<VisualsTable
					rows={filteredVisualRows}
					singleReportMode={singleReportMode}
					gridBorderClass={gridBorderClass}
					density={density}
					searchLocked={searchLocked}
					activeSearchQuery={query}
					onClearGlobalFilter={clearGlobal}
				/>
			)}
		</div>
	);
}

function PagesTable({
	rows,
	singleReportMode,
	gridBorderClass,
	density,
	searchLocked,
	activeSearchQuery,
	onClearGlobalFilter,
}: {
	rows: PageBreakdownRow[];
	singleReportMode: boolean;
	gridBorderClass: string;
	density: TableDensity;
	searchLocked: boolean;
	activeSearchQuery: string;
	onClearGlobalFilter: () => void;
}) {
	const cellPaddingClass = density === "compact" ? "px-2 py-1" : "px-2 py-1.5";
	const hasGlobalNoMatches = searchLocked && activeSearchQuery.trim().length > 0 && rows.length === 0;

	return (
		<div className="overflow-hidden rounded-md border border-ctp-surface2 bg-ctp-surface1">
			<div className="overflow-auto">
				<table className="w-full border-collapse text-xs">
					<thead>
						<tr className="bg-ctp-surface1">
							{!singleReportMode && (
								<th className={`border border-ctp-surface2 ${cellPaddingClass} text-left font-semibold text-(--app-fg-primary)`}>
									Report
								</th>
							)}
							<th className={`border border-ctp-surface2 ${cellPaddingClass} text-left font-semibold text-(--app-fg-primary)`}>Page</th>
							<th className={`border border-ctp-surface2 ${cellPaddingClass} text-right font-semibold text-(--app-fg-primary)`}>Uses</th>
							<th className={`border border-ctp-surface2 ${cellPaddingClass} text-right font-semibold text-(--app-fg-primary)`}>
								Visuals
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.length > 0 ? (
							rows.map((row, index) => (
								<tr key={`${row.report}:${row.page}`} className={`${zebraRowClass(index)} text-(--app-fg-secondary)`}>
									{!singleReportMode && <td className={`border ${gridBorderClass} ${cellPaddingClass} text-left`}>{row.report}</td>}
									<td className={`border ${gridBorderClass} ${cellPaddingClass} text-left`}>{row.page}</td>
									<td className={`border ${gridBorderClass} ${cellPaddingClass} text-right`}>{row.uses}</td>
									<td className={`border ${gridBorderClass} ${cellPaddingClass} text-right`}>{row.visuals}</td>
								</tr>
							))
						) : (
							<tr className="bg-(--app-zebra-row-first) text-(--app-fg-secondary)">
								<td colSpan={singleReportMode ? 3 : 4} className={`border ${gridBorderClass} ${cellPaddingClass} text-center`}>
									{hasGlobalNoMatches ? (
										<div className="flex flex-col items-center gap-1">
											<span>No matches for global filter "{activeSearchQuery}".</span>
											<button
												type="button"
												onClick={onClearGlobalFilter}
												className="text-(--app-fg-accent-text) underline underline-offset-2 hover:text-(--app-fg-primary)"
											>
												Clear filter
											</button>
										</div>
									) : (
										"No page usage found for this field."
									)}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function VisualsTable({
	rows,
	singleReportMode,
	gridBorderClass,
	density,
	searchLocked,
	activeSearchQuery,
	onClearGlobalFilter,
}: {
	rows: VisualBreakdownRow[];
	singleReportMode: boolean;
	gridBorderClass: string;
	density: TableDensity;
	searchLocked: boolean;
	activeSearchQuery: string;
	onClearGlobalFilter: () => void;
}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const hasGlobalNoMatches = searchLocked && activeSearchQuery.trim().length > 0 && rows.length === 0;

	const columns = useMemo<ColumnDef<VisualBreakdownRow>[]>(() => {
		const cols: ColumnDef<VisualBreakdownRow>[] = [];

		if (!singleReportMode) {
			cols.push({
				id: "report",
				accessorKey: "report",
				header: "Report",
				cell: (info) => info.getValue(),
			});
		}

		cols.push(
			{
				id: "page",
				accessorKey: "page",
				header: "Page",
				cell: (info) => info.getValue(),
			},
			{
				id: "visual",
				accessorKey: "visualDisplayName",
				header: "Visual",
				cell: (info) => {
					const row = info.row.original;
					return <span title={row.visualId}>{info.getValue() as string}</span>;
				},
				enableSorting: false,
			},
			{
				id: "type",
				accessorKey: "visualType",
				header: "Type",
				cell: (info) => info.getValue(),
				enableSorting: false,
			},
			{
				id: "roles",
				accessorKey: "roles",
				header: "Roles",
				cell: (info) => {
					const roles = info.getValue() as string[];
					if (density === "comfortable") {
						return (
							<div className="flex flex-wrap gap-1">
								{roles.map((role) => (
									<Chip key={role} className="text-xs">
										{role}
									</Chip>
								))}
							</div>
						);
					}
					return <span>{roles.join(", ")}</span>;
				},
				enableSorting: false,
			},
			{
				id: "hidden",
				accessorKey: "hidden",
				header: "Hidden",
				cell: (info) => {
					const hidden = info.getValue() as boolean;
					if (!hidden) {
						return null;
					}
					const checkSizeClass = density === "comfortable" ? "h-[18.5px] w-[18.5px]" : "h-3.5 w-3.5";
					return (
						<span title="Hidden" className="pbix-hidden-check inline-flex items-center justify-center text-ctp-peach">
							<Check aria-hidden="true" className={checkSizeClass} />
						</span>
					);
				},
				enableSorting: false,
			},
		);

		return cols;
	}, [singleReportMode, density]);

	const table = useReactTable({
		data: rows,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const cellPaddingClass = density === "compact" ? "px-2 py-1" : "px-2 py-1.5";

	return (
		<div className="overflow-hidden rounded-md border border-ctp-surface2 bg-ctp-surface1">
			<div className="overflow-auto">
				<table className="w-full border-collapse text-xs tabular-nums">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="bg-ctp-surface1">
								{headerGroup.headers.map((header) => {
									const sorted = header.column.getIsSorted();
									const canSort = header.column.getCanSort();
									const alignment = header.id === "hidden" ? "text-center" : "text-left";
									const widthClass = header.id === "hidden" ? "w-[1%] whitespace-nowrap" : "";

									return (
										<th
											key={header.id}
											scope="col"
											aria-sort={toAriaSort(sorted)}
											className={`border border-ctp-surface2 ${cellPaddingClass} font-semibold text-(--app-fg-primary) ${alignment} ${widthClass}`}
										>
											{header.isPlaceholder ? null : canSort ? (
												<button
													type="button"
													onClick={header.column.getToggleSortingHandler()}
													className={`inline-flex w-full items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) ${
														header.id === "hidden" ? "justify-center" : "justify-start"
													}`}
													aria-label={`Sort by ${header.column.id}`}
												>
													<span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
													<span className="inline-block w-4 text-center text-xs text-(--app-fg-muted)">
														{sortIcon(sorted)}
													</span>
												</button>
											) : (
												<span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.length === 0 ? (
							<tr className="bg-(--app-zebra-row-first) text-(--app-fg-secondary)">
								<td colSpan={table.getAllColumns().length} className={`border ${gridBorderClass} ${cellPaddingClass} text-center`}>
									{hasGlobalNoMatches ? (
										<div className="flex flex-col items-center gap-1">
											<span>No matches for global filter "{activeSearchQuery}".</span>
											<button
												type="button"
												onClick={onClearGlobalFilter}
												className="text-(--app-fg-accent-text) underline underline-offset-2 hover:text-(--app-fg-primary)"
											>
												Clear filter
											</button>
										</div>
									) : (
										"No visual usage found for this field."
									)}
								</td>
							</tr>
						) : (
							table.getRowModel().rows.map((row, rowIndex) => {
								const zebraClass = zebraRowClass(rowIndex);
								return (
									<tr key={row.id} className={`${zebraClass} text-(--app-fg-secondary)`}>
										{row.getVisibleCells().map((cell) => {
											const alignment = cell.column.id === "hidden" ? "text-center" : "text-left";
											const widthClass = cell.column.id === "hidden" ? "w-[1%] whitespace-nowrap" : "";

											return (
												<td key={cell.id} className={`border ${gridBorderClass} ${cellPaddingClass} ${alignment} ${widthClass}`}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											);
										})}
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
