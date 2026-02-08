export type { PbixLayout, PbixSection, PbixVisualContainer } from "./pbix";
export type { Pivot, FieldKey } from "./pivot";

// Re-export new types for convenience
export type { RawFieldReference } from "../extraction/raw-field-usage";
export type { NormalisedFieldUsage } from "../normalisation/field-normaliser";
export type {
	FieldUsageAggregation,
	FieldUsageAggregate,
	PageUsageDetail,
	PageInfo,
	AggregationSummary,
} from "../aggregation/field-aggregator";
export type { FieldKind } from "../extraction/field-classifier";
