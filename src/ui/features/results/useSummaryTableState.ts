// src/ui/features/results/useSummaryTableState.ts
import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { SummaryRow } from "../../../core/projections";

export function useSummaryTableState(rows: SummaryRow[], globalFilter: string) {
	const [sorting, setSorting] = useState<SortingState>([{ id: "totalUses", desc: true }]);
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
	const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

	// Pre-lowercased once so every row comparison is O(1) against the pre-computed searchText.
	const normalizedNeedle = globalFilter.trim().toLowerCase();
	const filteredRows = useMemo(() => {
		if (normalizedNeedle.length === 0) return rows;
		return rows.filter((row) => row.searchText.includes(normalizedNeedle));
	}, [normalizedNeedle, rows]);

	const toggleRow = (rowId: string) => {
		setExpandedRows((current) => ({ ...current, [rowId]: !current[rowId] }));
	};

	const toggleReport = (reportKey: string) => {
		setExpandedReports((current) => ({ ...current, [reportKey]: !current[reportKey] }));
	};

	const isRowExpanded = (rowId: string): boolean => Boolean(expandedRows[rowId]);
	const isReportExpanded = (reportKey: string): boolean => Boolean(expandedReports[reportKey]);

	return {
		sorting,
		setSorting,
		expandedRows,
		filteredRows,
		toggleRow,
		toggleReport,
		isRowExpanded,
		isReportExpanded,
	};
}
