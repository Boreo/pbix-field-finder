// src/core/report-analyser.ts
// Main orchestration for the three-stage dataflow

import type { PbixLayout } from "./types";

// Three-stage imports
import { extractRawFieldReferences, type RawFieldReference } from "./extraction/raw-field-usage";
import { normaliseFieldReferences, type NormalisedFieldUsage } from "./normalisation/field-normaliser";
import { aggregateFieldUsage, type FieldUsageAggregation } from "./aggregation/field-aggregator";

/**
 * Result of the complete three-stage analysis pipeline
 */
export type AnalysisResult = {
	/** Raw field references extracted from PBIX */
	raw: RawFieldReference[];
	/** Normalised field usage with classification and parsing */
	normalised: NormalisedFieldUsage[];
	/** Aggregated field usage statistics */
	aggregated: FieldUsageAggregation;
};

/**
 * Main analysis pipeline orchestrator.
 * Coordinates the three-stage dataflow: Raw -> Normalised -> Aggregated
 *
 * @param layout - PBIX layout structure
 * @param reportName - Name of the report
 * @returns Analysis result with data from all three stages
 */
export function analyseReport(layout: PbixLayout, reportName: string): AnalysisResult {
	// Stage 1: Extract raw data
	const { references, context } = extractRawFieldReferences(layout);

	// Stage 2: Normalise
	const normalised = normaliseFieldReferences(references, {
		...context,
		reportName,
	});

	// Stage 3: Aggregate
	const aggregated = aggregateFieldUsage(normalised);

	return {
		raw: references,
		normalised,
		aggregated,
	};
}
