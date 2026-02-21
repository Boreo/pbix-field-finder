import { fireEvent, render, screen } from "@testing-library/react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import type { SummaryRow } from "@/core/projections";
import { createSummaryColumns } from "./summaryColumns";

const baseRow: SummaryRow = {
	id: "summary:Orders|Amount",
	table: "Orders",
	field: "Amount",
	totalUses: 5,
	reportCount: 2,
	pageCount: 3,
	visualCount: 4,
	hiddenOnly: false,
	kind: "measure",
	reports: [],
	searchText: "orders amount measure",
};

function ColumnsHarness({
	rows,
	expandedRows,
	onToggleRow,
	singleReportMode,
}: {
	rows: SummaryRow[];
	expandedRows: Record<string, boolean>;
	onToggleRow: (rowId: string) => void;
	singleReportMode: boolean;
}) {
	const columns = createSummaryColumns({
		expandedRows,
		onToggleRow,
		singleReportMode,
	});
	const table = useReactTable({
		data: rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<table>
			<thead>
				{table.getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id}>
						{headerGroup.headers.map((header) => (
							<th key={header.id}>
								{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
							</th>
						))}
					</tr>
				))}
			</thead>
			<tbody>
				{table.getRowModel().rows.map((row) => (
					<tr key={row.id}>
						{row.getVisibleCells().map((cell) => (
							<td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

describe("createSummaryColumns", () => {
	it("returns expected column order with and without report count", () => {
		const withReports = createSummaryColumns({
			expandedRows: {},
			onToggleRow: vi.fn(),
			singleReportMode: false,
		});
		expect(withReports.map((column) => column.id)).toEqual([
			"table",
			"field",
			"reportCount",
			"totalUses",
			"pageCount",
			"visualCount",
			"hiddenOnly",
			"kind",
		]);

		const singleReport = createSummaryColumns({
			expandedRows: {},
			onToggleRow: vi.fn(),
			singleReportMode: true,
		});
		expect(singleReport.map((column) => column.id)).toEqual([
			"table",
			"field",
			"totalUses",
			"pageCount",
			"visualCount",
			"hiddenOnly",
			"kind",
		]);
	});

	it("renders expand/collapse labels and non-interactive table label", () => {
		const onToggleRow = vi.fn();

		const { rerender } = render(
			<ColumnsHarness
				rows={[baseRow]}
				expandedRows={{}}
				onToggleRow={onToggleRow}
				singleReportMode
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Expand Amount" }));
		expect(onToggleRow).toHaveBeenCalledWith(baseRow.id);

		expect(screen.getByText("Orders")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Filter summary by table Orders" })).toBeNull();

		rerender(
			<ColumnsHarness
				rows={[baseRow]}
				expandedRows={{ [baseRow.id]: true }}
				onToggleRow={onToggleRow}
				singleReportMode
			/>,
		);
		expect(screen.getByRole("button", { name: "Collapse Amount" })).toBeInTheDocument();
	});

	it("renders kind cells for measure, column, and fallback kinds", () => {
		render(
			<ColumnsHarness
				rows={[
					{ ...baseRow, id: "row-measure", kind: "measure", field: "Amount" },
					{ ...baseRow, id: "row-column", kind: "column", field: "OrderId" },
					{ ...baseRow, id: "row-unknown", kind: "unknown", field: "Mystery" },
				]}
				expandedRows={{}}
				onToggleRow={vi.fn()}
				singleReportMode
			/>,
		);

		expect(screen.getByText("Measure").parentElement?.className).toContain("pbix-measure-kind");
		expect(screen.getByText("Column").className).toContain("border-(--app-stroke)");
		expect(screen.getByText("Unknown")).toBeInTheDocument();
	});
});

