// src/core/aggregation/pivot-builder.ts
// Pivot structure builder (refactored from pivot.ts)

import type { NormalisedFieldUsage } from "../normalisation/field-normaliser";
import type { FieldUsageAggregation } from "./field-aggregator";
import type { Pivot, FieldKey } from "../types";

/**
 * Pivot build result
 */
export type PivotResult = {
	pivot: Pivot;
	pages: string[];
	fieldOrder: FieldKey[];
};

/**
 * Builds pivot structure from normalised field usage.
 */
export function buildPivotFromNormalised(normalised: NormalisedFieldUsage[]): PivotResult {
	const pivot: Pivot = {};
	const pages = new Set<string>();
	const fieldOrder: FieldKey[] = [];
	const seenFields = new Set<FieldKey>();
	const pageOrder = new Map<string, number>();

	for (const usage of normalised) {
		if (!usage.field) continue;

		const report = usage.report;
		const table = usage.table ?? "(unknown)";
		const field = usage.field;
		const page = usage.page;

		pages.add(page);

		// Track page ordering (from normalised data, not raw!)
		if (!pageOrder.has(page)) {
			pageOrder.set(page, usage.pageIndex);
		}

		// Track field order
		const key: FieldKey = `${report}|${table}|${field}`;
		if (!seenFields.has(key)) {
			seenFields.add(key);
			fieldOrder.push(key);
		}

		// Build nested pivot structure
		pivot[report] ??= {};
		pivot[report][table] ??= {};
		pivot[report][table][field] ??= {};
		pivot[report][table][field][page] = (pivot[report][table][field][page] ?? 0) + 1;
	}

	// Sort pages by their original order
	const orderedPages = Array.from(pages).sort((a, b) => (pageOrder.get(a) ?? 0) - (pageOrder.get(b) ?? 0));

	return { pivot, pages: orderedPages, fieldOrder };
}

/**
 * Builds legacy Pivot structure from aggregation.
 */
export function buildPivotFromAggregation(aggregation: FieldUsageAggregation): PivotResult {
	const pivot: Pivot = {};
	const fieldOrder: FieldKey[] = [];

	for (const agg of aggregation.fields) {
		fieldOrder.push(agg.fieldKey);

		// Build nested structure
		pivot[agg.report] ??= {};
		pivot[agg.report][agg.table] ??= {};
		pivot[agg.report][agg.table][agg.field] = {};

		// Add page counts
		for (const [pageName, pageDetail] of agg.usagesByPage) {
			pivot[agg.report][agg.table][agg.field][pageName] = pageDetail.usageCount;
		}
	}

	// Extract page names from aggregation, already sorted
	const pages = aggregation.pages.map((p) => p.name);

	return { pivot, pages, fieldOrder };
}
