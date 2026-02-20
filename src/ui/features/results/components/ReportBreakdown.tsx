// src/ui/features/results/components/ReportBreakdown.tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { Check, CircleX, Copy, Link2, Search, Unlink } from "lucide-react";
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
import { ToggleGroup } from "../../../primitives";
import { CopyFeedbackOverlay } from "../../../components/CopyFeedbackOverlay";
import { useCopyFeedback } from "../../../hooks/useCopyFeedback";
import { useBreakdownRows, type PageBreakdownRow, type VisualBreakdownRow } from "../useBreakdownRows";
import { useBreakdownState } from "../useBreakdownState";
import { sortIcon, toAriaSort, zebraRowClass, breakdownCellPadding } from "../table.utils";
import { EmptyFilterRow } from "./EmptyFilterRow";

type ReportBreakdownProps = {
	summaryRow: SummaryRow;
	allCanonicalUsages: CanonicalUsageRow[];
	density: TableDensity;
	singleReportMode: boolean;
	gridBorderClass: string;
};

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
	const searchInputRef = useRef<HTMLInputElement | null>(null);
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

	const onViewVisualsForPage = useCallback(
		(pageName: string) => {
			setActiveTab("visuals");
			setQuery(pageName);
			const focusSearchInput = () => {
				const node = searchInputRef.current;
				if (!node) {
					return;
				}
				node.focus();
				node.select();
			};
			if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
				window.requestAnimationFrame(focusSearchInput);
				return;
			}
			window.setTimeout(focusSearchInput, 0);
		},
		[setActiveTab, setQuery],
	);

	return (
		<div className="ml-2 space-y-2 rounded-md border border-ctp-surface2 bg-ctp-surface0 p-2">
			<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-md bg-ctp-mantle px-2 py-1.5">
				<div className="justify-self-start">
					<ToggleGroup aria-label="Breakdown view" value={activeTab} onChange={setActiveTab}>
						<ToggleGroup.Button value="pages" selected={activeTab === "pages"} onSelect={setActiveTab}>
							Pages
						</ToggleGroup.Button>
						<ToggleGroup.Button value="visuals" selected={activeTab === "visuals"} onSelect={setActiveTab}>
							Visuals
						</ToggleGroup.Button>
					</ToggleGroup>
				</div>

				<div className="justify-self-center">
					<div className="inline-flex flex-col items-start leading-tight">
						<p className="text-[11px] font-semibold text-(--app-fg-info)">{summaryRow.table}</p>
						<p className="text-sm font-semibold text-(--app-fg-secondary)">{summaryRow.field}</p>
					</div>
				</div>

				<div className="flex flex-col items-end gap-1 justify-self-end">
					<div className="flex items-center gap-1">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--app-fg-muted)" />
							<input
								ref={searchInputRef}
								type="text"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder={queryPlaceholder}
								aria-label={queryAriaLabel}
								className="h-7 w-48 rounded border border-ctp-surface2 bg-ctp-base pl-7 pr-7 text-xs text-(--app-fg-primary) placeholder:text-(--app-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--app-focus-ring)"
							/>
							{query ? (
								<button
									type="button"
									onClick={() => setQuery("")}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-(--app-fg-muted) transition-colors hover:text-(--app-fg-accent-text)"
									aria-label="Clear breakdown filter"
									title="Clear breakdown filter"
								>
									<CircleX aria-hidden="true" className="h-3.5 w-3.5" />
								</button>
							) : null}
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
							{searchLocked ? <Link2 className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
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
					onViewVisualsForPage={onViewVisualsForPage}
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
	onViewVisualsForPage,
}: {
	rows: PageBreakdownRow[];
	singleReportMode: boolean;
	gridBorderClass: string;
	density: TableDensity;
	searchLocked: boolean;
	activeSearchQuery: string;
	onClearGlobalFilter: () => void;
	onViewVisualsForPage: (pageName: string) => void;
}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const cellPaddingClass = breakdownCellPadding(density);
	const hasGlobalNoMatches = searchLocked && activeSearchQuery.trim().length > 0 && rows.length === 0;
	const columns = useMemo<ColumnDef<PageBreakdownRow>[]>(() => {
		const cols: ColumnDef<PageBreakdownRow>[] = [];
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
				id: "uses",
				accessorKey: "uses",
				header: "Uses",
				cell: (info) => info.getValue(),
			},
			{
				id: "visuals",
				accessorKey: "visuals",
				header: "Visuals",
				cell: (info) => {
					const row = info.row.original;
					return (
						<button
							type="button"
							onClick={() => onViewVisualsForPage(row.page)}
							title="View visuals on this page"
							aria-label={`View visuals on page ${row.page}`}
							className="inline-flex cursor-pointer items-center rounded-sm px-1 text-(--app-fg-info) underline-offset-2 transition-colors hover:bg-[color-mix(in_srgb,var(--app-accent)_18%,transparent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)"
						>
							{info.getValue() as number}
						</button>
					);
				},
			},
		);
		return cols;
	}, [onViewVisualsForPage, singleReportMode]);

	const table = useReactTable({
		data: rows,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div className="overflow-hidden rounded-md border border-ctp-surface2 bg-ctp-surface1">
			<div className="overflow-auto">
				<table className="w-full border-collapse text-xs">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="bg-ctp-surface1">
								{headerGroup.headers.map((header) => {
									const sorted = header.column.getIsSorted();
									const alignment = header.id === "uses" || header.id === "visuals" ? "text-right" : "text-left";
									const justify = header.id === "uses" || header.id === "visuals" ? "justify-end" : "justify-start";

									return (
										<th
											key={header.id}
											scope="col"
											aria-sort={toAriaSort(sorted)}
											className={`border border-ctp-surface2 ${cellPaddingClass} font-semibold text-(--app-fg-primary) ${alignment}`}
										>
											{header.isPlaceholder ? null : (
												<button
													type="button"
													onClick={header.column.getToggleSortingHandler()}
													className={`inline-flex w-full select-text items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) ${justify}`}
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
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, index) => (
								<tr key={row.id} className={`${zebraRowClass(index)} text-(--app-fg-secondary)`}>
									{row.getVisibleCells().map((cell) => {
										const alignment = cell.column.id === "uses" || cell.column.id === "visuals" ? "text-right" : "text-left";
										return (
											<td key={cell.id} className={`border ${gridBorderClass} ${cellPaddingClass} ${alignment}`}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										);
									})}
								</tr>
							))
						) : (
							<EmptyFilterRow
								colSpan={table.getAllColumns().length}
								borderClass={gridBorderClass}
								paddingClass={cellPaddingClass}
								hasFilterNoMatches={hasGlobalNoMatches}
								filterMessage={`No matches for global filter "${activeSearchQuery}".`}
								onClearFilter={onClearGlobalFilter}
								fallbackMessage="No page usage found for this field."
								rowClassName="bg-(--app-zebra-row-first) text-(--app-fg-secondary)"
							/>
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
	const { copyFeedbacks, showCopyFeedback } = useCopyFeedback();
	const hasGlobalNoMatches = searchLocked && activeSearchQuery.trim().length > 0 && rows.length === 0;

	const copyVisualIdToClipboard = useCallback(
		async (visualId: string, x: number, y: number) => {
			if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
				return;
			}
			await navigator.clipboard.writeText(visualId);
			showCopyFeedback({ x, y, message: "Copied visual ID" });
		},
		[showCopyFeedback],
	);

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
					const visualName = (info.getValue() as string) || row.visualId;
					return (
						<div className="group flex w-full min-w-0 items-center justify-between gap-1">
							<span title={row.visualId} className="min-w-0 flex-1 truncate">
								{visualName}
							</span>
							<button
								type="button"
								className="inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded text-(--app-fg-muted) opacity-0 transition hover:text-(--app-fg-info) group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)"
								title="Copy visual ID"
								aria-label={`Copy visual ID for ${visualName}`}
								onClick={(event) => {
									event.stopPropagation();
									const rect = event.currentTarget.getBoundingClientRect();
									const x = event.clientX || rect.left + rect.width / 2;
									const y = event.clientY || rect.top + rect.height / 2;
									void copyVisualIdToClipboard(row.visualId, x, y);
								}}
							>
								<Copy aria-hidden="true" className="h-3.5 w-3.5" />
							</button>
						</div>
					);
				},
			},
			{
				id: "type",
				accessorKey: "visualType",
				header: "Type",
				cell: (info) => info.getValue(),
			},
			{
				id: "roles",
				accessorFn: (row) => row.roles.join(", "),
				header: "Roles",
				cell: (info) => {
					const roles = info.row.original.roles;
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
				accessorFn: (row) => (row.hidden ? 1 : 0),
				header: "Hidden",
				cell: (info) => {
					const hidden = info.row.original.hidden;
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
			},
		);

		return cols;
	}, [copyVisualIdToClipboard, density, singleReportMode]);

	const table = useReactTable({
		data: rows,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const cellPaddingClass = breakdownCellPadding(density);

	return (
		<>
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
														className={`inline-flex w-full select-text items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) ${
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
								<EmptyFilterRow
									colSpan={table.getAllColumns().length}
									borderClass={gridBorderClass}
									paddingClass={cellPaddingClass}
									hasFilterNoMatches={hasGlobalNoMatches}
									filterMessage={`No matches for global filter "${activeSearchQuery}".`}
									onClearFilter={onClearGlobalFilter}
									fallbackMessage="No visual usage found for this field."
									rowClassName="bg-(--app-zebra-row-first) text-(--app-fg-secondary)"
								/>
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
			<CopyFeedbackOverlay feedbacks={copyFeedbacks} />
		</>
	);
}
