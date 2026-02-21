import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CanonicalUsageRow, SummaryRow } from "@/core/projections";
import { SummaryGrid } from "./SummaryGrid";

vi.mock("../../breakdown/components/ReportBreakdown", () => ({
	ReportBreakdown: () => <div data-testid="report-breakdown">Breakdown</div>,
}));

const summaryRow: SummaryRow = {
	id: "summary:Orders|Amount",
	table: "Orders",
	field: "Amount",
	totalUses: 3,
	reportCount: 1,
	pageCount: 1,
	visualCount: 2,
	hiddenOnly: false,
	kind: "measure",
	reports: [],
	searchText: "orders amount measure",
};

const canonicalUsages: CanonicalUsageRow[] = [
	{
		id: "c-1",
		report: "Sales",
		page: "Overview",
		pageIndex: 0,
		visualType: "table",
		visualId: "v1",
		visualTitle: "",
		role: "values",
		table: "Orders",
		field: "Amount",
		kind: "measure",
		isHiddenVisual: false,
		isHiddenFilter: false,
		hiddenUsage: false,
		reportPageKey: "Sales|Overview",
		reportVisualKey: "Sales|v1",
		searchText: "sales overview orders amount values table",
	},
];

function renderGrid({
	filteredRows = [summaryRow],
	globalFilter = "",
	onClearGlobalFilter = vi.fn(),
	setSorting = vi.fn(),
	onToggleRow = vi.fn(),
	isRowExpanded = () => false,
}: {
	filteredRows?: SummaryRow[];
	globalFilter?: string;
	onClearGlobalFilter?: () => void;
	setSorting?: ReturnType<typeof vi.fn>;
	onToggleRow?: ReturnType<typeof vi.fn>;
	isRowExpanded?: (rowId: string) => boolean;
} = {}) {
	return render(
		<SummaryGrid
			filteredRows={filteredRows}
			canonicalUsages={canonicalUsages}
			density="comfortable"
			singleReportMode={false}
			globalFilter={globalFilter}
			onClearGlobalFilter={onClearGlobalFilter}
			sorting={[]}
			setSorting={setSorting}
			expandedRows={{}}
			onToggleRow={onToggleRow}
			isRowExpanded={isRowExpanded}
		/>,
	);
}

describe("SummaryGrid", () => {
	it("renders empty-filter row and clear action when no rows match", async () => {
		const user = userEvent.setup();
		const onClearGlobalFilter = vi.fn();

		renderGrid({
			filteredRows: [],
			globalFilter: "missing",
			onClearGlobalFilter,
		});

		expect(screen.getByText('No summary rows match filter "missing".')).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Clear filter" }));
		expect(onClearGlobalFilter).toHaveBeenCalledTimes(1);
	});

	it("wires sortable header interactions", async () => {
		const user = userEvent.setup();
		const setSorting = vi.fn();
		renderGrid({ setSorting });

		await user.click(screen.getByRole("button", { name: "Sort by totalUses" }));
		expect(setSorting).toHaveBeenCalledTimes(1);
	});

	it("renders expansion row when expanded and toggles on row double-click only", () => {
		const onToggleRow = vi.fn();
		renderGrid({
			onToggleRow,
			isRowExpanded: (rowId) => rowId === summaryRow.id,
		});

		expect(screen.getByTestId("report-breakdown")).toBeInTheDocument();

		fireEvent.doubleClick(screen.getByText("Amount"));
		expect(onToggleRow).toHaveBeenCalledWith(summaryRow.id);
	});

	it("applies column sizing and alignment roles", () => {
		renderGrid();
		const table = screen.getByRole("table");
		expect(table.className).toContain("w-full");
		expect(table.className).toContain("table-auto");

		const fieldHeader = screen.getByRole("columnheader", { name: /^Field/ });
		expect(fieldHeader.className).toContain("w-auto");
		expect(fieldHeader.className).not.toContain("whitespace-nowrap");

		const tableHeader = screen.getByRole("columnheader", { name: /^Table/ });
		expect(tableHeader.className).not.toContain("w-px");
		expect(tableHeader.className).not.toContain("whitespace-nowrap");
		expect(screen.getByRole("columnheader", { name: /^Reports/ }).className).toContain("w-[100px]");
		expect(screen.getByRole("columnheader", { name: /^Total uses/ }).className).toContain("w-[100px]");
		expect(screen.getByRole("columnheader", { name: /^Pages/ }).className).toContain("w-[100px]");
		expect(screen.getByRole("columnheader", { name: /^Visuals/ }).className).toContain("w-[100px]");
		expect(screen.getByRole("columnheader", { name: /^Hidden-only/ }).className).toContain("w-[120px]");
		expect(screen.getByRole("columnheader", { name: /^Kind/ }).className).toContain("w-[144px]");

		const fieldCell = screen.getByText("Amount").closest("td");
		expect(fieldCell).not.toBeNull();
		expect(fieldCell?.className ?? "").toContain("w-auto");
		expect(fieldCell?.className ?? "").not.toContain("whitespace-nowrap");
		expect(screen.getByText("Amount").className).toContain("truncate");

		const kindHeader = screen.getByRole("columnheader", { name: /^Kind/ });
		expect(kindHeader.className).toContain("text-right");
		const kindCell = screen.getByText("Measure").closest("td");
		expect(kindCell?.className ?? "").toContain("text-right");
	});
});

