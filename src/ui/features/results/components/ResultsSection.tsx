// src/ui/features/results/components/ResultsSection.tsx
import type { Dispatch, SetStateAction } from "react";
import type { SummaryRow } from "../../../../core/projections";
import type { AnalysisResult } from "../../../../core/report-analyser";
import { SummaryTable } from "../../../components/SummaryTable";
import type { TableDensity } from "../../../types";

type ResultsSectionProps = {
	latestResult: AnalysisResult | null;
	exportDisabled: boolean;
	density: TableDensity;
	setDensity: Dispatch<SetStateAction<TableDensity>>;
	summaryRows: SummaryRow[];
	singleReportMode: boolean;
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	onExportSummaryJson: () => void;
	onExportRawCsv: () => void;
	onExportDetailsJson: () => void;
};

export function ResultsSection({
	latestResult,
	exportDisabled,
	density,
	setDensity,
	summaryRows,
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
		<SummaryTable
			rows={summaryRows}
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
	);
}
