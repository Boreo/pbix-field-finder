// src/ui/features/export/useExportActions.ts
// Thin wrapper so components don't depend on data-export directly.
import { useCallback } from "react";
import type { SummaryRow } from "../../../core/projections";
import type { NormalisedFieldUsage } from "../../../core/normalisation/field-normaliser";
import { exportDetailsJson, exportRawCsv, exportSummaryJson } from "../../../io/data-export";

type UseExportActionsParams = {
	summaryRows: SummaryRow[];
	normalisedRows: NormalisedFieldUsage[];
	exportScopeLabel: string;
};

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

	const onExportDetailsJson = useCallback(() => {
		exportDetailsJson(normalisedRows, exportScopeLabel);
	}, [normalisedRows, exportScopeLabel]);

	return {
		onExportSummaryJson,
		onExportRawCsv,
		onExportDetailsJson,
	};
}
