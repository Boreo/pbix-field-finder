// src/ui/features/results/useSummaryTableState.ts
import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { SummaryRow } from "../../../core/projections";

/**
 * Manage sorting, expansion, and filtering state for the summary table.
 * @param rows Summary rows before client-side filtering and sorting.
 * @param globalFilter Case-insensitive search string applied to each row's precomputed search text.
 * @returns Table state and handlers for sorting plus row expansion controls.
 */
export function useSummaryTableState(rows: SummaryRow[], globalFilter: string) {
	const [sorting, setSorting] = useState<SortingState>([{ id: "totalUses", desc: true }]);
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

	// Pre-lowercased once so every row comparison is O(1) against the pre-computed searchText.
	const normalizedNeedle = globalFilter.trim().toLowerCase();
	const filteredRows = useMemo(() => {
		if (normalizedNeedle.length === 0) return rows;
		return rows.filter((row) => row.searchText.includes(normalizedNeedle));
	}, [normalizedNeedle, rows]);

	const toggleRow = (rowId: string) => {
		setExpandedRows((current) => ({ ...current, [rowId]: !current[rowId] }));
	};

	const isRowExpanded = (rowId: string): boolean => Boolean(expandedRows[rowId]);

	return {
		sorting,
		setSorting,
		expandedRows,
		filteredRows,
		toggleRow,
		isRowExpanded,
	};
}
