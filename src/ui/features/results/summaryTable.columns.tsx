// src/ui/features/results/summaryTable.columns.tsx
import { Minus, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { SummaryRow } from "../../../core/projections";

type SummaryColumnsParams = {
	expandedRows: Record<string, boolean>;
	onToggleRow: (rowId: string) => void;
	singleReportMode: boolean;
};

export function createSummaryColumns({
	expandedRows,
	onToggleRow,
	singleReportMode,
}: SummaryColumnsParams): ColumnDef<SummaryRow>[] {
	const columns: ColumnDef<SummaryRow>[] = [
		{
			id: "field",
			header: "Table / Field",
			accessorFn: (row) => `${row.table} / ${row.field}`,
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => onToggleRow(row.original.id)}
						aria-expanded={expandedRows[row.original.id] === true}
						className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-base font-semibold leading-none text-(--app-fg-secondary) transition-colors hover:text-(--app-fg-accent-text)"
						aria-label={expandedRows[row.original.id] ? `Collapse ${row.original.field}` : `Expand ${row.original.field}`}
						title={expandedRows[row.original.id] ? `Collapse ${row.original.field}` : `Expand ${row.original.field}`}
					>
						{expandedRows[row.original.id] ? (
							<Minus aria-hidden="true" className="h-4 w-4" />
						) : (
							<Plus aria-hidden="true" className="h-4 w-4" />
						)}
					</button>
					<span className="font-semibold text-(--app-fg-info)">{row.original.table}</span>
					<span className="text-(--app-fg-muted)">/</span>
					<span className="text-(--app-fg-secondary)">{row.original.field}</span>
				</div>
			),
		},
		{ id: "totalUses", header: "Total uses", accessorFn: (row) => row.totalUses },
		{ id: "pageCount", header: "Pages", accessorFn: (row) => row.pageCount },
		{ id: "visualCount", header: "Visuals", accessorFn: (row) => row.visualCount },
		{ id: "hiddenOnly", header: "Hidden-only", accessorFn: (row) => (row.hiddenOnly ? "Yes" : "No") },
		{ id: "kind", header: "Kind", accessorFn: (row) => row.kind },
	];

	if (!singleReportMode) {
		columns.splice(2, 0, { id: "reportCount", header: "Reports", accessorFn: (row) => row.reportCount });
	}

	return columns;
}
