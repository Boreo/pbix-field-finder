// src/ui/features/results/components/ReportBreakdown.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Lock, LockOpen, Search } from "lucide-react";
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
import {
	BREAKDOWN_TAB_STORAGE_KEY,
	BREAKDOWN_SEARCH_STORAGE_KEY,
	BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY,
} from "../../preferences/persistenceKeys";

type ReportBreakdownProps = {
	summaryRow: SummaryRow;
	allCanonicalUsages: CanonicalUsageRow[];
	density: TableDensity;
	singleReportMode: boolean;
	gridBorderClass: string;
};

type TabKey = "pages" | "visuals";

type PageBreakdownRow = {
	report: string;
	page: string;
	pageIndex: number;
	uses: number;
	visuals: number;
};

type VisualBreakdownRow = {
	report: string;
	page: string;
	pageIndex: number;
	visualDisplayName: string;
	visualType: string;
	visualId: string;
	rawType: string;
	roles: string[];
	hidden: boolean;
	uses: number;
};

function zebraRowClass(index: number) {
	return index % 2 === 0 ? "bg-[var(--app-zebra-row-first)]" : "bg-[var(--app-zebra-row-second)]";
}

function toFriendlyVisualType(rawType: string): string {
	const mapping: Record<string, string> = {
		pivotTable: "Table",
		tableEx: "Table",
		clusteredColumnChart: "Column Chart",
		lineChart: "Line Chart",
		pieChart: "Pie Chart",
		donutChart: "Donut Chart",
		card: "Card",
		multiRowCard: "Card",
		slicer: "Slicer",
		map: "Map",
		shape: "Shape",
		textbox: "Text Box",
	};
	return mapping[rawType] ?? rawType;
}

function computeVisualDisplayNames(
	canonicalUsages: CanonicalUsageRow[],
	report: string,
	page: string,
): Map<string, string> {
	const visualsOnPage = new Map<
		string,
		{
			visualType: string;
			visualTitle: string;
			pageIndex: number;
		}
	>();

	for (const usage of canonicalUsages) {
		if (usage.report === report && usage.page === page) {
			if (!visualsOnPage.has(usage.visualId)) {
				visualsOnPage.set(usage.visualId, {
					visualType: usage.visualType,
					visualTitle: usage.visualTitle,
					pageIndex: usage.pageIndex,
				});
			}
		}
	}

	const sorted = Array.from(visualsOnPage.entries()).sort((a, b) => {
		const aData = a[1];
		const bData = b[1];
		if (aData.pageIndex !== bData.pageIndex) {
			return aData.pageIndex - bData.pageIndex;
		}
		return a[0].localeCompare(b[0]);
	});

	const displayNames = new Map<string, string>();
	const typeCounts = new Map<string, number>();

	for (const [visualId, data] of sorted) {
		if (data.visualTitle && data.visualTitle.trim().length > 0) {
			displayNames.set(visualId, data.visualTitle);
		} else {
			const friendlyType = toFriendlyVisualType(data.visualType);
			const ordinal = (typeCounts.get(friendlyType) ?? 0) + 1;
			typeCounts.set(friendlyType, ordinal);
			displayNames.set(visualId, `${friendlyType} (${ordinal})`);
		}
	}

	return displayNames;
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

const BREAKDOWN_SEARCH_CHANGE_EVENT = "breakdown-search-change";
type BreakdownSearchChangeDetail = { locked: boolean; query: string };
let hasInitializedBreakdownSearch = false;

function initializeBreakdownSearchScope() {
	if (typeof window === "undefined" || hasInitializedBreakdownSearch) return;
	hasInitializedBreakdownSearch = true;
	window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "false");
	window.localStorage.removeItem(BREAKDOWN_SEARCH_STORAGE_KEY);
}

function dispatchBreakdownSearchChange(detail: BreakdownSearchChangeDetail) {
	window.dispatchEvent(new CustomEvent<BreakdownSearchChangeDetail>(BREAKDOWN_SEARCH_CHANGE_EVENT, { detail }));
}

function getStoredTab(): TabKey {
	if (typeof window === "undefined") return "pages";
	const stored = window.localStorage.getItem(BREAKDOWN_TAB_STORAGE_KEY);
	return stored === "visuals" ? "visuals" : "pages";
}

function getStoredSearch(): string {
	if (typeof window === "undefined") return "";
	initializeBreakdownSearchScope();
	return window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY) ?? "";
}

function getStoredSearchLocked(): boolean {
	if (typeof window === "undefined") return false;
	initializeBreakdownSearchScope();
	return window.localStorage.getItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY) === "true";
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
	const [activeTab, setActiveTab] = useState<TabKey>(() => getStoredTab());
	const [searchLocked, setSearchLocked] = useState(() => getStoredSearchLocked());
	const [localSearchQuery, setLocalSearchQuery] = useState("");
	const [globalSearchQuery, setGlobalSearchQuery] = useState(() => getStoredSearch());
	const activeSearchQuery = searchLocked ? globalSearchQuery : localSearchQuery;

	// Persist tab selection
	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(BREAKDOWN_TAB_STORAGE_KEY, activeTab);
		}
	}, [activeTab]);

	// Sync search lock state across component instances via custom events
	useEffect(() => {
		const handleSearchChange = (event: Event) => {
			const customEvent = event as CustomEvent<BreakdownSearchChangeDetail>;
			const detail = customEvent.detail;
			const isLocked = detail?.locked ?? window.localStorage.getItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY) === "true";
			const query = detail?.query ?? (window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY) ?? "");
			setSearchLocked(isLocked);
			if (isLocked) {
				setGlobalSearchQuery(query);
			} else {
				setGlobalSearchQuery("");
				setLocalSearchQuery(query);
			}
		};

		window.addEventListener(BREAKDOWN_SEARCH_CHANGE_EVENT, handleSearchChange);
		return () => window.removeEventListener(BREAKDOWN_SEARCH_CHANGE_EVENT, handleSearchChange);
	}, []);

	const toggleSearchLock = useCallback(() => {
		if (typeof window === "undefined") return;
		if (searchLocked) {
			const queryToKeep = globalSearchQuery;
			setSearchLocked(false);
			setGlobalSearchQuery("");
			setLocalSearchQuery(queryToKeep);
			window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "false");
			window.localStorage.removeItem(BREAKDOWN_SEARCH_STORAGE_KEY);
			dispatchBreakdownSearchChange({ locked: false, query: queryToKeep });
			return;
		}

		const promotedQuery = localSearchQuery;
		setSearchLocked(true);
		setGlobalSearchQuery(promotedQuery);
		window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "true");
		window.localStorage.setItem(BREAKDOWN_SEARCH_STORAGE_KEY, promotedQuery);
		dispatchBreakdownSearchChange({ locked: true, query: promotedQuery });
	}, [searchLocked, localSearchQuery, globalSearchQuery]);

	const clearGlobalFilter = useCallback(() => {
		if (typeof window === "undefined") return;
		setGlobalSearchQuery("");
		window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "true");
		window.localStorage.removeItem(BREAKDOWN_SEARCH_STORAGE_KEY);
		dispatchBreakdownSearchChange({ locked: true, query: "" });
	}, []);

	// Derive page breakdown rows
	const pageRows = useMemo<PageBreakdownRow[]>(() => {
		const rows: PageBreakdownRow[] = [];

		for (const report of summaryRow.reports) {
			for (const page of report.pages) {
				rows.push({
					report: report.report,
					page: page.page,
					pageIndex: page.pageIndex,
					uses: page.count,
					visuals: page.distinctVisuals,
				});
			}
		}

		rows.sort((a, b) => {
			if (a.report !== b.report) return a.report.localeCompare(b.report);
			return a.pageIndex - b.pageIndex;
		});

		return rows;
	}, [summaryRow.reports]);

	// Derive visual breakdown rows
	const visualRows = useMemo<VisualBreakdownRow[]>(() => {
		const fieldUsages = allCanonicalUsages.filter(
			(u) => u.table === summaryRow.table && u.field === summaryRow.field,
		);

		const grouped = new Map<
			string,
			Map<
				string,
				Map<
					string,
					{
						visualType: string;
						visualTitle: string;
						pageIndex: number;
						roles: Set<string>;
						isHiddenVisual: boolean;
						isHiddenFilter: boolean;
						uses: number;
					}
				>
			>
		>();

		for (const usage of fieldUsages) {
			if (!grouped.has(usage.report)) {
				grouped.set(usage.report, new Map());
			}
			const reportMap = grouped.get(usage.report)!;

			if (!reportMap.has(usage.page)) {
				reportMap.set(usage.page, new Map());
			}
			const pageMap = reportMap.get(usage.page)!;

			if (!pageMap.has(usage.visualId)) {
				pageMap.set(usage.visualId, {
					visualType: usage.visualType,
					visualTitle: usage.visualTitle,
					pageIndex: usage.pageIndex,
					roles: new Set(),
					isHiddenVisual: usage.isHiddenVisual,
					isHiddenFilter: usage.isHiddenFilter,
					uses: 0,
				});
			}
			const visual = pageMap.get(usage.visualId)!;
			visual.roles.add(usage.role);
			visual.uses += 1;
		}

		const rows: VisualBreakdownRow[] = [];
		for (const [report, pageMap] of grouped) {
			for (const [page, visualMap] of pageMap) {
				const displayNames = computeVisualDisplayNames(allCanonicalUsages, report, page);

				for (const [visualId, data] of visualMap) {
					rows.push({
						report,
						page,
						pageIndex: data.pageIndex,
						visualDisplayName: displayNames.get(visualId) ?? "Untitled Visual",
						visualType: toFriendlyVisualType(data.visualType),
						visualId,
						rawType: data.visualType,
						roles: Array.from(data.roles).sort(),
						hidden: data.isHiddenVisual || data.isHiddenFilter,
						uses: data.uses,
					});
				}
			}
		}

		return rows;
	}, [allCanonicalUsages, summaryRow.table, summaryRow.field]);

	// Filter rows based on search query
	const filteredPageRows = useMemo(() => {
		if (!activeSearchQuery.trim()) return pageRows;
		const needle = activeSearchQuery.toLowerCase();
		return pageRows.filter((row) => {
			return (
				row.page.toLowerCase().includes(needle) || (singleReportMode ? false : row.report.toLowerCase().includes(needle))
			);
		});
	}, [pageRows, activeSearchQuery, singleReportMode]);

	const filteredVisualRows = useMemo(() => {
		if (!activeSearchQuery.trim()) return visualRows;
		const needle = activeSearchQuery.toLowerCase();
		return visualRows.filter((row) => {
			return (
				row.page.toLowerCase().includes(needle) ||
				row.visualDisplayName.toLowerCase().includes(needle) ||
				row.visualType.toLowerCase().includes(needle) ||
				row.rawType.toLowerCase().includes(needle) ||
				row.roles.some((r) => r.toLowerCase().includes(needle)) ||
				String(row.hidden).toLowerCase().includes(needle) ||
				(singleReportMode ? false : row.report.toLowerCase().includes(needle))
			);
		});
	}, [visualRows, activeSearchQuery, singleReportMode]);

	return (
		<div className="space-y-2 rounded border border-ctp-surface2 bg-ctp-mantle p-2">
			{/* Tab UI and Search */}
			<div className="flex items-center justify-between gap-2">
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

				{/* Search bar */}
				<div className="flex flex-col items-end gap-1">
					<div className="flex items-center gap-1">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--app-fg-muted)" />
							<input
								type="text"
								value={activeSearchQuery}
								onChange={(e) => {
									const newQuery = e.target.value;
									if (searchLocked) {
										setGlobalSearchQuery(newQuery);
										window.localStorage.setItem(BREAKDOWN_SEARCH_STORAGE_KEY, newQuery);
										dispatchBreakdownSearchChange({ locked: true, query: newQuery });
										return;
									}
									setLocalSearchQuery(newQuery);
								}}
								placeholder={searchLocked ? "Global filter..." : "Filter this breakdown..."}
								aria-label={searchLocked ? "Global filter" : "Filter this breakdown"}
								className="h-7 w-48 rounded border border-ctp-surface2 bg-ctp-base pl-7 pr-2 text-xs text-(--app-fg-primary) placeholder:text-(--app-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--app-focus-ring)"
							/>
						</div>
						<button
							type="button"
							onClick={toggleSearchLock}
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

			{/* Tab content */}
			{activeTab === "pages" ? (
				<PagesTable
					rows={filteredPageRows}
					singleReportMode={singleReportMode}
					gridBorderClass={gridBorderClass}
					density={density}
					searchLocked={searchLocked}
					activeSearchQuery={activeSearchQuery}
					onClearGlobalFilter={clearGlobalFilter}
				/>
			) : (
				<VisualsTable
					rows={filteredVisualRows}
					singleReportMode={singleReportMode}
					gridBorderClass={gridBorderClass}
					density={density}
					searchLocked={searchLocked}
					activeSearchQuery={activeSearchQuery}
					onClearGlobalFilter={clearGlobalFilter}
				/>
			)}
		</div>
	);
}

// Pages Tab Component
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
		<table className="w-full border-collapse text-xs">
			<thead>
				<tr className="bg-ctp-surface0">
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
	);
}

// Visuals Tab Component with TanStack Table sorting
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
	const [sorting, setSorting] = useState<SortingState>([{ id: "uses", desc: true }]);
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
					const label = hidden ? "true" : "false";
					if (density === "comfortable") {
						return (
							<Chip
								className={`text-xs ${
									hidden
										? "border-[color-mix(in_srgb,var(--color-ctp-yellow)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-ctp-yellow)_20%,transparent)] text-(--app-fg-warning)"
										: "border-ctp-surface2 bg-ctp-crust text-(--app-fg-muted)"
								}`}
							>
								{label}
							</Chip>
						);
					}
					return <span className={hidden ? "text-(--app-fg-warning)" : "text-(--app-fg-muted)"}>{label}</span>;
				},
				enableSorting: false,
			},
			{
				id: "uses",
				accessorKey: "uses",
				header: "Uses",
				cell: (info) => info.getValue(),
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
		<div className="overflow-auto">
			<table className="w-full border-collapse text-xs tabular-nums">
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="bg-ctp-surface0">
							{headerGroup.headers.map((header) => {
								const sorted = header.column.getIsSorted();
								const canSort = header.column.getCanSort();
								// Alignment: Report, Page, Visual, Type, Roles are left; Hidden is center; Uses is right
								const alignment =
									header.id === "hidden" ? "text-center" : header.id === "uses" ? "text-right" : "text-left";

								return (
									<th
										key={header.id}
										scope="col"
										aria-sort={toAriaSort(sorted)}
										className={`border border-ctp-surface2 ${cellPaddingClass} font-semibold text-(--app-fg-primary) ${alignment}`}
									>
										{header.isPlaceholder ? null : canSort ? (
											<button
												type="button"
												onClick={header.column.getToggleSortingHandler()}
												className={`inline-flex w-full items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) ${
													header.id === "hidden" ? "justify-center" : header.id === "uses" ? "justify-end" : "justify-start"
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
							<td
								colSpan={table.getAllColumns().length}
								className={`border ${gridBorderClass} ${cellPaddingClass} text-center`}
							>
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
										// Match header alignment
										const alignment =
											cell.column.id === "hidden" ? "text-center" : cell.column.id === "uses" ? "text-right" : "text-left";

										return (
											<td key={cell.id} className={`border ${gridBorderClass} ${cellPaddingClass} ${alignment}`}>
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
	);
}
