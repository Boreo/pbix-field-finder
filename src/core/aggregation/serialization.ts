// src/core/aggregation/serialization.ts
// Converts Maps and Sets to plain objects for JSON serialization

import type { FieldUsageAggregate, FieldUsageAggregation, PageInfo } from "./field-aggregator";

export type SerializedPageUsageDetail = {
	pageName: string;
	pageIndex: number;
	usageCount: number;
	visualIds: string[];
	roles: string[]; // Set converted to Array
};

export type SerializedFieldUsageAggregate = Omit<
	FieldUsageAggregate,
	"usagesByPage" | "usagesByVisualType" | "usagesByRole"
> & {
	usagesByPage: Record<string, SerializedPageUsageDetail>;
	usagesByVisualType: Record<string, number>;
	usagesByRole: Record<string, number>;
};

export type SerializedFieldUsageAggregation = {
	fields: SerializedFieldUsageAggregate[];
	pages: PageInfo[];
	summary: {
		totalFields: number;
		totalUsages: number;
		fieldsByKind: Record<string, number>;
		pageCount: number;
	};
};

/**
 * Converts Map and Set objects to plain objects/arrays for JSON serialization.
 * JavaScript Maps serialize as {} which makes them invisible in logs.
 */
export function serializeFieldUsageAggregate(agg: FieldUsageAggregate): SerializedFieldUsageAggregate {
	return {
		report: agg.report,
		table: agg.table,
		field: agg.field,
		fieldKey: agg.fieldKey,
		totalUsages: agg.totalUsages,
		usagesByPage: Object.fromEntries(
			Array.from(agg.usagesByPage.entries()).map(([page, detail]) => [
				page,
				{
					...detail,
					roles: Array.from(detail.roles), // Convert Set to Array
				},
			]),
		),
		usagesByVisualType: Object.fromEntries(agg.usagesByVisualType),
		usagesByRole: Object.fromEntries(agg.usagesByRole),
		fieldKind: agg.fieldKind,
		expression: agg.expression,
		hasHiddenUsages: agg.hasHiddenUsages,
		hasVisibleUsages: agg.hasVisibleUsages,
		hiddenUsageCount: agg.hiddenUsageCount,
	};
}

/**
 * Serializes the complete aggregation result for logging/export.
 */
export function serializeFieldUsageAggregation(aggregation: FieldUsageAggregation): SerializedFieldUsageAggregation {
	return {
		fields: aggregation.fields.map(serializeFieldUsageAggregate),
		pages: aggregation.pages,
		summary: {
			...aggregation.summary,
			fieldsByKind: Object.fromEntries(aggregation.summary.fieldsByKind),
		},
	};
}
