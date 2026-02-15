// src/ui/components/SummaryTable.test.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import type { SummaryRow } from "../../core/projections";
import { SummaryTable } from "./SummaryTable";

const rows: SummaryRow[] = [
	{
		id: "summary:Orders|Amount",
		table: "Orders",
		field: "Amount",
		totalUses: 4,
		reportCount: 2,
		pageCount: 3,
		visualCount: 3,
		hiddenOnly: false,
		kind: "measure",
		reports: [
			{
				report: "Sales",
				totalUses: 3,
				pageCount: 2,
				visualCount: 2,
				pages: [
					{ page: "Overview", pageIndex: 1, count: 2, distinctVisuals: 1 },
					{ page: "Detail", pageIndex: 0, count: 1, distinctVisuals: 1 },
				],
			},
		],
		searchText: "orders amount measure",
	},
];

describe("SummaryTable", () => {
	const onDensityChange = vi.fn();
	const onExportSummaryJson = vi.fn();
	const onExportRawCsv = vi.fn();
	const onExportDetailsJson = vi.fn();

	it("renders summary metric columns without dynamic page-name headers", () => {
		render(
			<SummaryTable
				rows={rows}
				density="comfortable"
				onDensityChange={onDensityChange}
				singleReportMode={false}
				globalFilter=""
				onGlobalFilterChange={vi.fn()}
				exportDisabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		expect(screen.getByRole("columnheader", { name: /^Table \/ Field/ })).toBeInTheDocument();
		const totalUsesHeader = screen.getByRole("columnheader", { name: /^Total uses/ });
		expect(totalUsesHeader).toBeInTheDocument();
		expect(totalUsesHeader).toHaveAttribute("aria-sort", "descending");
		expect(screen.getByRole("columnheader", { name: /^Reports/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sort by totalUses" })).toBeInTheDocument();
		expect(screen.queryByRole("columnheader", { name: "Overview" })).not.toBeInTheDocument();
		expect(screen.queryByText(/^Pages in:/)).not.toBeInTheDocument();
	});

	it("expands row to show per-report and per-page breakdown", async () => {
		const user = userEvent.setup();
		render(
			<SummaryTable
				rows={rows}
				density="comfortable"
				onDensityChange={onDensityChange}
				singleReportMode={false}
				globalFilter=""
				onGlobalFilterChange={vi.fn()}
				exportDisabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Expand Amount" }));
		expect(screen.getByText("Per-report breakdown")).toBeInTheDocument();
		expect(screen.getByText("Sales")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Toggle report Sales" }));
		expect(screen.getByText("Overview")).toBeInTheDocument();
	});

	it("hides reports column and simplifies breakdown in single-report mode", async () => {
		const user = userEvent.setup();
		render(
			<SummaryTable
				rows={rows}
				density="comfortable"
				onDensityChange={onDensityChange}
				singleReportMode
				globalFilter=""
				onGlobalFilterChange={vi.fn()}
				exportDisabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		expect(screen.queryByRole("columnheader", { name: /^Reports/ })).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Expand Amount" }));
		expect(screen.getByText("Page breakdown")).toBeInTheDocument();
		expect(screen.queryByText("Per-report breakdown")).not.toBeInTheDocument();
		const breakdownTable = screen.getByText("Page breakdown").nextElementSibling as HTMLTableElement;
		const breakdown = within(breakdownTable);
		expect(breakdown.getByRole("columnheader", { name: "Page" })).toBeInTheDocument();
		expect(breakdown.getByRole("columnheader", { name: "Uses" })).toBeInTheDocument();
		expect(breakdown.getByRole("columnheader", { name: "Visuals" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Toggle report Sales" })).not.toBeInTheDocument();
	});

	it("renders density controls in a dedicated lane above the table", () => {
		render(
			<SummaryTable
				rows={rows}
				density="comfortable"
				onDensityChange={onDensityChange}
				singleReportMode={false}
				globalFilter=""
				onGlobalFilterChange={vi.fn()}
				exportDisabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		const densityGroup = screen.getByRole("group", { name: "Row spacing controls" });
		const comfortableButton = screen.getByRole("button", { name: "Set row spacing to comfortable" });
		const compactButton = screen.getByRole("button", { name: "Set row spacing to compact" });
		const exportButton = screen.getByRole("button", { name: "Export summary JSON" });

		expect(densityGroup.className).toContain("z-0");
		expect(densityGroup.className).toContain("inline-flex");
		expect(densityGroup.className).toContain("bg-[color-mix(in_srgb,var(--color-ctp-mantle)_76%,var(--color-ctp-base))]");
		expect(densityGroup.className).toContain("opacity-85");
		expect(densityGroup.className).not.toContain("shadow");
		expect(densityGroup.className).not.toContain("absolute");
		expect(densityGroup.className).toContain("rounded-b-none");
		expect(densityGroup.className).toContain("border-b-0");
		expect(densityGroup.parentElement?.className ?? "").toContain("flex");
		expect(densityGroup.parentElement?.className ?? "").toContain("justify-between");
		expect(densityGroup.parentElement?.className ?? "").toContain("px-2");
		expect(densityGroup.parentElement?.className ?? "").toContain("-mb-px");
		expect(screen.getByText("Summary table")).toBeInTheDocument();
		expect(comfortableButton.className).toContain("h-6");
		expect(comfortableButton.className).toContain("w-6");
		expect(comfortableButton.className).toContain("bg-[color-mix(in_srgb,var(--color-ctp-overlay0)_14%,transparent)]");
		expect(compactButton.className).toContain("h-6");
		expect(compactButton.className).toContain("w-6");
		expect(comfortableButton).toHaveAttribute("aria-pressed", "true");
		expect(compactButton).toHaveAttribute("aria-pressed", "false");
		expect(exportButton).toBeInTheDocument();
		expect(densityGroup.contains(exportButton)).toBe(false);
		expect(screen.getByLabelText("Filter summary table")).toBeInTheDocument();
		expect(screen.queryByRole("radiogroup", { name: "Row density" })).not.toBeInTheDocument();
		expect(screen.queryByText("Comfortable")).not.toBeInTheDocument();
		expect(screen.queryByText("Compact")).not.toBeInTheDocument();
	});

	it("does not pin the first summary column", () => {
		render(
			<SummaryTable
				rows={rows}
				density="comfortable"
				onDensityChange={onDensityChange}
				singleReportMode={false}
				globalFilter=""
				onGlobalFilterChange={vi.fn()}
				exportDisabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		const firstDataRowHeader = screen.getByRole("rowheader");
		expect(firstDataRowHeader.className).not.toContain("left-0");
	});

	it("shows and clears the summary filter clear button when query is present", async () => {
		const user = userEvent.setup();
		const onGlobalFilterChange = vi.fn();

		const { rerender } = render(
			<SummaryTable
				rows={rows}
				density="comfortable"
				onDensityChange={onDensityChange}
				singleReportMode={false}
				globalFilter=""
				onGlobalFilterChange={onGlobalFilterChange}
				exportDisabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);
		expect(screen.queryByRole("button", { name: "Clear summary filter" })).not.toBeInTheDocument();

		rerender(
			<SummaryTable
				rows={rows}
				density="comfortable"
				onDensityChange={onDensityChange}
				singleReportMode={false}
				globalFilter="amount"
				onGlobalFilterChange={onGlobalFilterChange}
				exportDisabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Clear summary filter" }));
		expect(onGlobalFilterChange).toHaveBeenCalledWith("");
	});
});
