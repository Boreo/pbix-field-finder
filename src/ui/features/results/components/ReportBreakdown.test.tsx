import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import type { CanonicalUsageRow, SummaryRow } from "../../../../core/projections";
import { ReportBreakdown } from "./ReportBreakdown";

function makeCanonicalUsageRow({
	id,
	table,
	field,
	page,
	pageIndex,
	visualType,
	visualId,
	role,
	isHiddenVisual = false,
	isHiddenFilter = false,
}: {
	id: string;
	table: string;
	field: string;
	page: string;
	pageIndex: number;
	visualType: string;
	visualId: string;
	role: string;
	isHiddenVisual?: boolean;
	isHiddenFilter?: boolean;
}): CanonicalUsageRow {
	const report = "Sales";
	return {
		id,
		report,
		page,
		pageIndex,
		visualType,
		visualId,
		visualTitle: "",
		role,
		table,
		field,
		kind: "measure",
		isHiddenVisual,
		isHiddenFilter,
		hiddenUsage: isHiddenVisual || isHiddenFilter,
		reportPageKey: `${report}|${page}`,
		reportVisualKey: `${report}|${visualId}`,
		searchText: `${report} ${page} ${table} ${field} ${role}`.toLowerCase(),
	};
}

const amountSummaryRow: SummaryRow = {
	id: "summary:Orders|Amount",
	table: "Orders",
	field: "Amount",
	totalUses: 3,
	reportCount: 1,
	pageCount: 2,
	visualCount: 2,
	hiddenOnly: false,
	kind: "measure",
	reports: [
		{
			report: "Sales",
			totalUses: 3,
			pageCount: 2,
			visualCount: 2,
			pages: [
				{ page: "Overview", pageIndex: 0, count: 2, distinctVisuals: 1 },
				{ page: "Details", pageIndex: 1, count: 1, distinctVisuals: 1 },
			],
		},
	],
	searchText: "orders amount measure",
};

const regionSummaryRow: SummaryRow = {
	id: "summary:Customers|Region",
	table: "Customers",
	field: "Region",
	totalUses: 1,
	reportCount: 1,
	pageCount: 1,
	visualCount: 1,
	hiddenOnly: false,
	kind: "column",
	reports: [
		{
			report: "Sales",
			totalUses: 1,
			pageCount: 1,
			visualCount: 1,
			pages: [{ page: "Map", pageIndex: 0, count: 1, distinctVisuals: 1 }],
		},
	],
	searchText: "customers region column",
};

const canonicalUsages: CanonicalUsageRow[] = [
	makeCanonicalUsageRow({
		id: "amount:v1:values",
		table: "Orders",
		field: "Amount",
		page: "Overview",
		pageIndex: 0,
		visualType: "tableEx",
		visualId: "v1",
		role: "Values",
		isHiddenVisual: true,
	}),
	makeCanonicalUsageRow({
		id: "amount:v1:category",
		table: "Orders",
		field: "Amount",
		page: "Overview",
		pageIndex: 0,
		visualType: "tableEx",
		visualId: "v1",
		role: "Category",
		isHiddenVisual: true,
	}),
	makeCanonicalUsageRow({
		id: "amount:v2:x",
		table: "Orders",
		field: "Amount",
		page: "Details",
		pageIndex: 1,
		visualType: "lineChart",
		visualId: "v2",
		role: "X",
	}),
	makeCanonicalUsageRow({
		id: "region:v3:values",
		table: "Customers",
		field: "Region",
		page: "Map",
		pageIndex: 0,
		visualType: "map",
		visualId: "v3",
		role: "Values",
	}),
];

function renderBreakdownPair() {
	render(
		<div>
			<div data-testid="amount-breakdown">
				<ReportBreakdown
					summaryRow={amountSummaryRow}
					allCanonicalUsages={canonicalUsages}
					density="comfortable"
					singleReportMode={false}
					gridBorderClass="border-ctp-surface2"
				/>
			</div>
			<div data-testid="region-breakdown">
				<ReportBreakdown
					summaryRow={regionSummaryRow}
					allCanonicalUsages={canonicalUsages}
					density="comfortable"
					singleReportMode={false}
					gridBorderClass="border-ctp-surface2"
				/>
			</div>
		</div>,
	);

	return {
		amount: within(screen.getByTestId("amount-breakdown")),
		region: within(screen.getByTestId("region-breakdown")),
	};
}

describe("ReportBreakdown", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("renders Pages by default and switches to Visuals", async () => {
		const user = userEvent.setup();
		const { amount } = renderBreakdownPair();

		expect(amount.getByRole("columnheader", { name: "Uses" })).toBeInTheDocument();
		expect(amount.queryByRole("columnheader", { name: "Type" })).not.toBeInTheDocument();

		await user.click(amount.getByRole("button", { name: "Visuals" }));

		expect(amount.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
		expect(amount.queryByRole("columnheader", { name: "Uses" })).not.toBeInTheDocument();
	});

	it("applies local filter only to the active breakdown instance", async () => {
		const user = userEvent.setup();
		const { amount, region } = renderBreakdownPair();

		const amountInput = amount.getByPlaceholderText("Filter this breakdown...") as HTMLInputElement;
		const regionInput = region.getByPlaceholderText("Filter this breakdown...") as HTMLInputElement;

		await user.type(amountInput, "overview");

		expect(amountInput).toHaveValue("overview");
		expect(regionInput).toHaveValue("");
	});

	it("supports global lock sync across instances and clear-filter guidance", async () => {
		const user = userEvent.setup();
		const { amount, region } = renderBreakdownPair();

		await user.type(region.getByPlaceholderText("Filter this breakdown..."), "nomatch");
		await user.click(region.getByRole("button", { name: "Lock global breakdown filter" }));

		await waitFor(() => {
			expect(amount.getByPlaceholderText("Global filter...")).toHaveValue("nomatch");
		});
		expect(amount.getByText('No matches for global filter "nomatch".')).toBeInTheDocument();

		await user.click(amount.getByRole("button", { name: "Clear filter" }));

		expect(amount.getByPlaceholderText("Global filter...")).toHaveValue("");
		expect(amount.queryByText('No matches for global filter "nomatch".')).not.toBeInTheDocument();
	});

	it("renders hidden indicator and role chips in Visuals mode", async () => {
		const user = userEvent.setup();
		const { amount } = renderBreakdownPair();

		await user.click(amount.getByRole("button", { name: "Visuals" }));

		const valuesChip = amount.getByText("Values").closest("span");
		const hiddenChip = amount.getByTitle("Hidden");

		expect(valuesChip?.className ?? "").toContain("bg-ctp-crust");
		expect(hiddenChip?.className ?? "").toContain("text-ctp-peach");
		expect(hiddenChip?.querySelector("svg.lucide-check")).not.toBeNull();
	});
});
