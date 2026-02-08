// core/types.ts

export interface PbixLayout {
	id: number;
	reportId: number;
	filters?: string;
	config?: string;
	sections?: PbixSection[];
}

export interface PbixSection {
	name: string;
	displayName?: string;
	visualContainers?: PbixVisualContainer[];
	displayOption?: "Default" | "Tooltip";
}

export interface PbixVisualContainer {
	id: string;
	config?: unknown;
}

export type Pivot = {
	[report: string]: {
		[table: string]: {
			[field: string]: {
				[page: string]: number;
			};
		};
	};
};

export type FieldKey = string; // "report|table|field"

// Re-export new types for convenience
export type { RawFieldReference } from "./extraction/raw-field-usage";
export type { NormalisedFieldUsage } from "./normalisation/field-normaliser";
export type {
	FieldUsageAggregation,
	FieldUsageAggregate,
	PageUsageDetail,
	PageInfo,
	AggregationSummary,
} from "./aggregation/field-aggregator";
export type { FieldKind } from "./extraction/field-classifier";
