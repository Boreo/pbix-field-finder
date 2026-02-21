// src/ui/features/results/summaryTable.columns.tsx
import { Minus, Plus, Sigma } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { SummaryRow } from "@/core/projections";

type SummaryColumnsParams = {
	expandedRows: Record<string, boolean>;
	onToggleRow: (rowId: string) => void;
	singleReportMode: boolean;
};

/**
 * Build TanStack column definitions for the summary results grid.
 * @param params Column-builder inputs for expansion state and report-mode behaviour.
 * @param params.expandedRows Row-expansion state keyed by summary row id.
 * @param params.onToggleRow Toggles expansion for a summary row.
 * @param params.singleReportMode Indicates whether report-count columns should be omitted.
 * @returns Ordered column definitions for the summary table.
 */
export function createSummaryColumns({
	expandedRows,
	onToggleRow,
	singleReportMode,
}: SummaryColumnsParams): ColumnDef<SummaryRow>[] {
	const columns: ColumnDef<SummaryRow>[] = [
		{
			id: "table",
			header: "Table",
			accessorFn: (row) => row.table,
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onToggleRow(row.original.id)}
						aria-expanded={expandedRows[row.original.id] === true}
						className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-base font-semibold leading-none text-(--app-fg-secondary) transition-colors hover:text-(--app-link)"
						aria-label={expandedRows[row.original.id] ? `Collapse ${row.original.field}` : `Expand ${row.original.field}`}
						title={expandedRows[row.original.id] ? `Collapse ${row.original.field}` : `Expand ${row.original.field}`}
					>
						{expandedRows[row.original.id] ? (
							<Minus aria-hidden="true" className="h-4 w-4" />
						) : (
							<Plus aria-hidden="true" className="h-4 w-4" />
						)}
					</button>
					<span className="select-text font-semibold text-(--app-link)">
						{row.original.table}
					</span>
				</div>
			),
		},
		{
			id: "field",
			header: "Field",
			accessorFn: (row) => row.field,
			cell: ({ row }) => (
				<span className="block min-w-0 truncate select-text font-semibold text-(--app-fg-secondary)">
					{row.original.field}
				</span>
			),
		},
		{ id: "totalUses", header: "Total uses", accessorFn: (row) => row.totalUses },
		{ id: "pageCount", header: "Pages", accessorFn: (row) => row.pageCount },
		{ id: "visualCount", header: "Visuals", accessorFn: (row) => row.visualCount },
		{ id: "hiddenOnly", header: "Hidden-only", accessorFn: (row) => (row.hiddenOnly ? "Yes" : "No") },
		{
			id: "kind",
			header: "Kind",
			accessorFn: (row) => row.kind,
			cell: ({ row }) => {
				const kind = row.original.kind;
				const label = kind.charAt(0).toUpperCase() + kind.slice(1);
				const isMeasure = kind === "measure";
				const isColumn = kind === "column";
				return isMeasure ? (
					<span className="pbix-measure-kind inline-flex items-center gap-1 rounded-sm bg-[color-mix(in_srgb,var(--app-cta-orange)_18%,transparent)] px-1.5 py-0.5 text-[color-mix(in_srgb,var(--app-cta-orange)_60%,var(--app-fg-warning)_40%)]">
						<Sigma aria-hidden="true" className="h-3.5 w-3.5" />
						<span>{label}</span>
					</span>
				) : isColumn ? (
					<span className="inline-flex items-center rounded-sm border border-(--app-stroke) bg-(--app-surface-0) px-1.5 py-0.5 text-(--app-fg-secondary)">
						{label}
					</span>
				) : (
					<span>{label}</span>
				);
			},
		},
	];

	if (!singleReportMode) {
		columns.splice(2, 0, { id: "reportCount", header: "Reports", accessorFn: (row) => row.reportCount });
	}

	return columns;
}

