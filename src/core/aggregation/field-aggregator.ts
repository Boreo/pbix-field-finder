// src/core/aggregation/field-aggregator.ts
// Aggregation with multi-dimensional stats

import type { NormalisedFieldUsage } from "../normalisation/field-normaliser";
import type { FieldKind } from "../extraction/field-classifier";

/**
 * Detailed usage information per page
 */
export type PageUsageDetail = {
	pageName: string;
	pageIndex: number;
	usageCount: number;
	visualIds: string[];
	roles: Set<string>;
};

/**
 * Aggregated field usage statistics.
 */
export type FieldUsageAggregate = {
	// Field identity
	report: string;
	table: string;
	field: string;
	fieldKey: string;

	// Aggregated metrics
	totalUsages: number;
	usagesByPage: Map<string, PageUsageDetail>;
	usagesByVisualType: Map<string, number>;
	usagesByRole: Map<string, number>;

	// Field properties
	fieldKind: FieldKind;
	expression?: string;

	// Visibility summary
	hasHiddenUsages: boolean;
	hasVisibleUsages: boolean;
	hiddenUsageCount: number;
};

/**
 * Page information with ordering
 */
export type PageInfo = {
	name: string;
	index: number;
};

/**
 * High-level aggregation summary
 */
export type AggregationSummary = {
	totalFields: number;
	totalUsages: number;
	fieldsByKind: Map<FieldKind, number>;
	pageCount: number;
};

/**
 * Complete aggregation result
 */
export type FieldUsageAggregation = {
	fields: FieldUsageAggregate[];
	pages: PageInfo[];
	summary: AggregationSummary;
};

/**
 * Builds page information with proper ordering from normalised data.
 */
function buildPageInfo(normalised: NormalisedFieldUsage[]): PageInfo[] {
	const pageMap = new Map<string, PageInfo>();

	for (const usage of normalised) {
		if (!pageMap.has(usage.page)) {
			pageMap.set(usage.page, {
				name: usage.page,
				index: usage.pageIndex,
			});
		}
	}

	// Sort by pageIndex
	return Array.from(pageMap.values()).sort((a, b) => a.index - b.index);
}

/**
 * Calculates summary statistics from aggregated fields.
 */
function calculateSummary(aggregates: FieldUsageAggregate[]): AggregationSummary {
	const fieldsByKind = new Map<FieldKind, number>();
	let totalUsages = 0;

	for (const agg of aggregates) {
		totalUsages += agg.totalUsages;
		fieldsByKind.set(agg.fieldKind, (fieldsByKind.get(agg.fieldKind) ?? 0) + 1);
	}

	return {
		totalFields: aggregates.length,
		totalUsages,
		fieldsByKind,
		pageCount: 0,
	};
}

/**
 * Groups up the normalised fields and counts everything.
 * Tallies by field, page, visual type, role
 */
export function aggregateFieldUsage(normalised: NormalisedFieldUsage[]): FieldUsageAggregation {
	const pages = buildPageInfo(normalised);

	// Group by field key: report|table|field
	const fieldMap = new Map<string, NormalisedFieldUsage[]>();

	for (const usage of normalised) {
		const table = usage.table ?? "(unknown)";
		const field = usage.field ?? "(unknown)";
		const fieldKey = `${usage.report}|${table}|${field}`;

		if (!fieldMap.has(fieldKey)) {
			fieldMap.set(fieldKey, []);
		}
		fieldMap.get(fieldKey)!.push(usage);
	}

	// Aggregate each field
	const fields: FieldUsageAggregate[] = [];

	for (const [fieldKey, usages] of fieldMap.entries()) {
		const [report, table, field] = fieldKey.split("|");

		// Aggregate by page
		const usagesByPage = new Map<string, PageUsageDetail>();
		const usagesByVisualType = new Map<string, number>();
		const usagesByRole = new Map<string, number>();

		let hiddenUsageCount = 0;
		let hasHiddenUsages = false;
		let hasVisibleUsages = false;

		for (const usage of usages) {
			// Page aggregation
			if (!usagesByPage.has(usage.page)) {
				usagesByPage.set(usage.page, {
					pageName: usage.page,
					pageIndex: usage.pageIndex,
					usageCount: 0,
					visualIds: [],
					roles: new Set(),
				});
			}
			const pageDetail = usagesByPage.get(usage.page)!;
			pageDetail.usageCount++;
			if (!pageDetail.visualIds.includes(usage.visualId)) {
				pageDetail.visualIds.push(usage.visualId);
			}
			pageDetail.roles.add(usage.role);

			// Visual type aggregation
			usagesByVisualType.set(usage.visualType, (usagesByVisualType.get(usage.visualType) ?? 0) + 1);

			// Role aggregation
			usagesByRole.set(usage.role, (usagesByRole.get(usage.role) ?? 0) + 1);

			// Visibility tracking
			if (usage.isHiddenVisual || usage.isHiddenFilter) {
				hiddenUsageCount++;
				hasHiddenUsages = true;
			} else {
				hasVisibleUsages = true;
			}
		}

		fields.push({
			report,
			table,
			field,
			fieldKey,
			totalUsages: usages.length,
			usagesByPage,
			usagesByVisualType,
			usagesByRole,
			fieldKind: usages[0].fieldKind,
			expression: usages[0].expression ?? undefined,
			hasHiddenUsages,
			hasVisibleUsages,
			hiddenUsageCount,
		});
	}

	const summary = calculateSummary(fields);
	summary.pageCount = pages.length;

	return {
		fields,
		pages,
		summary,
	};
}
