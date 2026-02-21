// src/ui/features/export/useExportActions.ts
// Thin wrapper so components don't depend on data-export directly.
import { useCallback } from "react";
import type { SummaryRow } from "@/core/projections";
import type { NormalisedFieldUsage } from "@/core/normalisation/field-normaliser";
import { copyRawCsvToClipboard, exportDetailsJson, exportRawCsv, exportSummaryJson } from "@/io/data-export";

type UseExportActionsParams = {
	summaryRows: SummaryRow[];
	normalisedRows: NormalisedFieldUsage[];
	exportScopeLabel: string;
};

/**
 * Create memoised export handlers for summary, raw, and detail datasets.
 * @param params Export-hook inputs used by the underlying file-export functions.
 * @param params.summaryRows Summary rows currently displayed in the UI.
 * @param params.normalisedRows Normalised usage rows used for raw and detail exports.
 * @param params.exportScopeLabel Filename label applied to all exported files.
 * @returns Stable click handlers for summary JSON, raw CSV, and detail JSON exports.
 */
export function useExportActions({
	summaryRows,
	normalisedRows,
	exportScopeLabel,
}: UseExportActionsParams) {
	const onExportSummaryJson = useCallback(() => {
		exportSummaryJson(summaryRows, exportScopeLabel);
	}, [exportScopeLabel, summaryRows]);

	const onExportRawCsv = useCallback(() => {
		exportRawCsv(normalisedRows, exportScopeLabel);
	}, [normalisedRows, exportScopeLabel]);

	const onCopyRawCsv = useCallback(() => {
		copyRawCsvToClipboard(normalisedRows);
	}, [normalisedRows]);

	const onExportDetailsJson = useCallback(() => {
		exportDetailsJson(normalisedRows, exportScopeLabel);
	}, [normalisedRows, exportScopeLabel]);

	return {
		onCopyRawCsv,
		onExportSummaryJson,
		onExportRawCsv,
		onExportDetailsJson,
	};
}

