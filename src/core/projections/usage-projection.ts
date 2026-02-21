// src/core/projections/usage-projection.ts
import type { NormalisedFieldUsage } from "../normalisation/field-normaliser";
import type { CanonicalUsageRow } from "./types";

/**
 * Normalise nullable text values into non-empty projection-safe strings.
 * @param value Raw table or field value from a normalised usage row.
 * @returns The trimmed value, or `(unknown)` when the input is null, undefined, or blank.
 */
function cleanValue(value: string | null): string {
	const trimmed = value?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : "(unknown)";
}

/**
 * Project normalised usage rows into canonical rows used by summary, details, and UI filtering.
 * @param normalised Normalised usage rows from the core analysis pipeline.
 * @returns Canonical usage rows with stable IDs, grouping keys, and precomputed lowercase search text.
 */
export function toCanonicalUsageRows(normalised: NormalisedFieldUsage[]): CanonicalUsageRow[] {
	return normalised.map((usage, index) => {
		const table = cleanValue(usage.table);
		const field = cleanValue(usage.field);
		const hiddenUsage = Boolean(usage.isHiddenVisual || usage.isHiddenFilter);
		const visualTitle = usage.visualTitle ?? "";
		const pageId = usage.pageId ?? (usage.page.trim().length > 0 ? usage.page : String(usage.pageIndex));
		const pageType = usage.pageType ?? "Default";
		const reportPageKey = `${usage.report}|${usage.page}`;
		const reportVisualKey = `${usage.report}|${usage.visualId}`;
		// Index suffix keeps IDs unique when the same field appears twice in a visual.
		const id = `${usage.report}|${usage.page}|${usage.visualId}|${usage.role}|${table}|${field}|${index}`;

		return {
			report: usage.report,
			page: usage.page,
			pageIndex: usage.pageIndex,
			pageId,
			pageType,
			visualType: usage.visualType,
			visualId: usage.visualId,
			visualTitle,
			role: usage.role,
			table,
			field,
			kind: usage.fieldKind,
			isHiddenVisual: Boolean(usage.isHiddenVisual),
			isHiddenFilter: Boolean(usage.isHiddenFilter),
			hiddenUsage,
			reportPageKey,
			reportVisualKey,
			// Pre-computed lowercase so the UI can filter with a simple includes().
			searchText: `${usage.report} ${usage.page} ${table} ${field} ${usage.role} ${usage.visualType} ${visualTitle} ${pageType ?? ""}`.toLowerCase(),
			id,
		};
	});
}
