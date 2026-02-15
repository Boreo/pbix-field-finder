// src/ui/features/results/useProjectionViewModel.ts
import { useMemo } from "react";
import { buildDetailsRows, buildSummaryRows, toCanonicalUsageRows } from "../../../core/projections";
import type { AnalysisResult } from "../../../core/report-analyser";
import type { LoadedFileEntry } from "./workflow.types";

type ProjectionViewModelParams = {
	latestResult: AnalysisResult | null;
	latestDatasetLabel: string;
	isProcessing: boolean;
	loadedFiles: LoadedFileEntry[];
};

const MAX_ROWS_FOR_DETAILS_PROJECTION = 100_000;

export function useProjectionViewModel({
	latestResult,
	latestDatasetLabel,
	isProcessing,
	loadedFiles,
}: ProjectionViewModelParams) {
	const visibleReportNames = useMemo(() => {
		const visible = new Set<string>();
		for (const entry of loadedFiles) {
			if (entry.visible) {
				visible.add(entry.reportName);
			}
		}
		return visible;
	}, [loadedFiles]);

	const allLoadedReportsVisible = useMemo(
		() => loadedFiles.length === 0 || loadedFiles.every((entry) => entry.visible),
		[loadedFiles],
	);

	const filteredNormalised = useMemo(() => {
		if (!latestResult) {
			return [];
		}
		if (allLoadedReportsVisible) {
			return latestResult.normalised;
		}
		return latestResult.normalised.filter((row) => visibleReportNames.has(row.report));
	}, [allLoadedReportsVisible, latestResult, visibleReportNames]);

	const canonicalUsages = useMemo(() => toCanonicalUsageRows(filteredNormalised), [filteredNormalised]);
	const summaryRows = useMemo(() => buildSummaryRows(canonicalUsages), [canonicalUsages]);

	const detailsRows = useMemo(() => {
		if (canonicalUsages.length > MAX_ROWS_FOR_DETAILS_PROJECTION) {
			return [];
		}
		return buildDetailsRows(canonicalUsages);
	}, [canonicalUsages]);

	const singleReportMode = useMemo(
		() => new Set(canonicalUsages.map((usage) => usage.report)).size === 1,
		[canonicalUsages],
	);

	const exportScopeLabel = latestDatasetLabel || "output";
	const exportDisabled = !latestResult || filteredNormalised.length === 0 || isProcessing;

	return {
		canonicalUsages,
		filteredNormalised,
		summaryRows,
		detailsRows,
		singleReportMode,
		exportScopeLabel,
		exportDisabled,
	};
}
