// src/core/report-analyser.ts
// Contract: extraction is pure data, normalisation is interpretation.

import type { PbixLayout } from "./types";

import { extractRawFieldReferences, type RawFieldReference } from "./extraction/raw-field-usage";
import { normaliseFieldReferences, type NormalisedFieldUsage } from "./normalisation/field-normaliser";

/**
 * Captures both extraction and normalisation outputs for a single report analysis run.
 */
export type AnalysisResult = {
	/** Raw field references extracted from PBIX */
	raw: RawFieldReference[];
	/** Normalised field usage with classification and parsing */
	normalised: NormalisedFieldUsage[];
};

/**
 * Run the core report analysis pipeline from raw extraction to normalised usage rows.
 * @param layout Parsed PBIX layout payload used as the extraction source.
 * @param reportName Stable report name to stamp onto each normalised usage row.
 * @returns An object containing raw references and normalised usage records for downstream projections.
 */
export function analyseReport(layout: PbixLayout, reportName: string): AnalysisResult {
	// Stage 1: Extract raw data
	const { references, context } = extractRawFieldReferences(layout);

	// Stage 2: Normalise
	const normalised = normaliseFieldReferences(references, {
		...context,
		reportName,
	});

	return {
		raw: references,
		normalised,
	};
}
