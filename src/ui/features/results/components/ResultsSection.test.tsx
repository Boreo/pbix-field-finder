import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CanonicalUsageRow, SummaryRow } from "../../../../core/projections";
import type { AnalysisResult } from "../../../../core/report-analyser";
import { ResultsSection } from "./ResultsSection";

const mocks = vi.hoisted(() => ({
	summaryTable: vi.fn(),
}));

vi.mock("../../../components/SummaryTable", () => ({
	SummaryTable: (props: unknown) => {
		mocks.summaryTable(props);
		return <div data-testid="summary-table" />;
	},
}));

const summaryRows: SummaryRow[] = [
	{
		id: "summary:Orders|Amount",
		table: "Orders",
		field: "Amount",
		totalUses: 2,
		reportCount: 1,
		pageCount: 1,
		visualCount: 2,
		hiddenOnly: false,
		kind: "measure",
		reports: [],
		searchText: "orders amount measure",
	},
];

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
		searchText: "sales overview orders amount",
	},
];

const latestResult: AnalysisResult = {
	normalised: [
		{
			report: "Sales",
			page: "Overview",
			pageIndex: 0,
			visualType: "table",
			visualId: "v1",
			visualTitle: "",
			role: "values",
			table: "Orders",
			field: "Amount",
			fieldKind: "measure",
			expression: null,
			isHiddenVisual: false,
			isHiddenFilter: false,
		},
	],
};

describe("ResultsSection", () => {
	it("returns null when latest result is missing", () => {
		render(
			<ResultsSection
				latestResult={null}
				exportDisabled
				density="comfortable"
				setDensity={vi.fn()}
				summaryRows={[]}
				canonicalUsages={[]}
				singleReportMode
				globalFilter=""
				onGlobalFilterChange={vi.fn()}
				onCopyRawCsv={vi.fn()}
				onExportSummaryJson={vi.fn()}
				onExportRawCsv={vi.fn()}
				onExportDetailsJson={vi.fn()}
			/>,
		);

		expect(screen.queryByTestId("summary-table")).toBeNull();
	});

	it("renders summary table with expected props when result exists", () => {
		const setDensity = vi.fn();
		const onGlobalFilterChange = vi.fn();
		const onCopyRawCsv = vi.fn();
		const onExportSummaryJson = vi.fn();
		const onExportRawCsv = vi.fn();
		const onExportDetailsJson = vi.fn();

		render(
			<ResultsSection
				latestResult={latestResult}
				exportDisabled={false}
				density="compact"
				setDensity={setDensity}
				summaryRows={summaryRows}
				canonicalUsages={canonicalUsages}
				singleReportMode={false}
				globalFilter="orders"
				onGlobalFilterChange={onGlobalFilterChange}
				onCopyRawCsv={onCopyRawCsv}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		expect(screen.getByTestId("summary-table")).toBeInTheDocument();
		expect(mocks.summaryTable).toHaveBeenCalledTimes(1);
		expect(mocks.summaryTable.mock.calls[0]?.[0]).toMatchObject({
			rows: summaryRows,
			canonicalUsages,
			density: "compact",
			onDensityChange: setDensity,
			singleReportMode: false,
			globalFilter: "orders",
			onGlobalFilterChange,
			exportDisabled: false,
			onCopyRawCsv,
			onExportSummaryJson,
			onExportRawCsv,
			onExportDetailsJson,
		});
	});
});
