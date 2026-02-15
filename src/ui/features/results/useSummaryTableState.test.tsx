// src/ui/features/results/useSummaryTableState.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SummaryRow } from "../../../core/projections";
import { useSummaryTableState } from "./useSummaryTableState";

const rows: SummaryRow[] = [
	{
		id: "summary:Orders|Amount",
		table: "Orders",
		field: "Amount",
		totalUses: 3,
		reportCount: 1,
		pageCount: 1,
		visualCount: 1,
		hiddenOnly: false,
		kind: "measure",
		reports: [{ report: "Sales", totalUses: 3, pageCount: 1, visualCount: 1, pages: [] }],
		searchText: "orders amount measure",
	},
];

describe("useSummaryTableState", () => {
	it("filters rows by search text", () => {
		const { result, rerender } = renderHook(
			({ filter }) => useSummaryTableState(rows, filter),
			{ initialProps: { filter: "" } },
		);

		expect(result.current.filteredRows).toHaveLength(1);
		rerender({ filter: "missing" });
		expect(result.current.filteredRows).toHaveLength(0);
	});

	it("toggles row/report expansion state", () => {
		const { result } = renderHook(() => useSummaryTableState(rows, ""));
		const rowId = rows[0].id;
		const reportKey = `${rowId}:Sales`;

		expect(result.current.isRowExpanded(rowId)).toBe(false);
		expect(result.current.isReportExpanded(reportKey)).toBe(false);

		act(() => {
			result.current.toggleRow(rowId);
			result.current.toggleReport(reportKey);
		});

		expect(result.current.isRowExpanded(rowId)).toBe(true);
		expect(result.current.isReportExpanded(reportKey)).toBe(true);
	});
});
