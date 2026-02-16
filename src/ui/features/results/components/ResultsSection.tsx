// src/ui/features/results/components/ResultsSection.tsx
import type { Dispatch, SetStateAction } from "react";
import type { CanonicalUsageRow, SummaryRow } from "../../../../core/projections";
import type { AnalysisResult } from "../../../../core/report-analyser";
import { SummaryTable } from "../../../components/SummaryTable";
import type { TableDensity } from "../../../types";

type ResultsSectionProps = {
	latestResult: AnalysisResult | null;
	exportDisabled: boolean;
	density: TableDensity;
	setDensity: Dispatch<SetStateAction<TableDensity>>;
	summaryRows: SummaryRow[];
	canonicalUsages: CanonicalUsageRow[];
	singleReportMode: boolean;
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	onExportSummaryJson: () => void;
	onExportRawCsv: () => void;
	onExportDetailsJson: () => void;
};

/**
 * Render the results section when processed data is available.
 * @param props Results-section props containing projection rows, filters, and export handlers.
 * @param props.latestResult Latest analysis result, used to decide whether the section should render.
 * @param props.exportDisabled Indicates whether export actions are currently allowed.
 * @param props.density Active row-density mode for the summary table.
 * @param props.setDensity Updates the active row-density mode.
 * @param props.summaryRows Summary rows to display in the table.
 * @param props.canonicalUsages Canonical usage rows for visual-level breakdown details.
 * @param props.singleReportMode Indicates whether report-count columns should be hidden.
 * @param props.globalFilter Current summary-table filter text.
 * @param props.onGlobalFilterChange Updates summary-table filter text.
 * @param props.onExportSummaryJson Exports grouped summary data as JSON.
 * @param props.onExportRawCsv Exports normalised raw data as CSV.
 * @param props.onExportDetailsJson Exports detailed grouped data as JSON.
 * @returns The summary table section, or `null` when no result is available.
 */
export function ResultsSection({
	latestResult,
	exportDisabled,
	density,
	setDensity,
	summaryRows,
	canonicalUsages,
	singleReportMode,
	globalFilter,
	onGlobalFilterChange,
	onExportSummaryJson,
	onExportRawCsv,
	onExportDetailsJson,
}: ResultsSectionProps) {
	if (!latestResult) {
		return null;
	}

	return (
		<>
			{/* Section: Summary table */}
			<SummaryTable
				rows={summaryRows}
				canonicalUsages={canonicalUsages}
				density={density}
				onDensityChange={setDensity}
				singleReportMode={singleReportMode}
				globalFilter={globalFilter}
				onGlobalFilterChange={onGlobalFilterChange}
				exportDisabled={exportDisabled}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>
		</>
	);
}
