// src/core/report-analyser.ts
// Contract: extraction is pure data, normalisation is interpretation.

import type { PbixLayout } from "./types";

import {
	extractRawFieldReferences,
	type ExtractionResult,
	type RawFieldReference,
} from "./extraction/raw-field-usage";
import { normaliseFieldReferences, type NormalisedFieldUsage } from "./normalisation/field-normaliser";

/**
 * Captures analysis outputs for a single report analysis run.
 */
export type AnalysisResult = {
	/** Normalised field usage with classification and parsing */
	normalised: NormalisedFieldUsage[];
	/** Raw field references extracted from PBIX (present only when explicitly requested). */
	raw?: RawFieldReference[];
};

export type AnalysisOptions = {
	/** Include extracted raw references in the result payload. Defaults to false. */
	includeRaw?: boolean;
};

export type AnalysisResultWithRaw = AnalysisResult & {
	raw: RawFieldReference[];
};

/**
 * Run the core report analysis pipeline from raw extraction to normalised usage rows.
 * @param layout Parsed PBIX layout payload used as the extraction source.
 * @param reportName Stable report name to stamp onto each normalised usage row.
 * @param options Optional analysis controls.
 * @returns An object containing normalised usage records and optional raw references.
 */
export function analyseReport(
	layout: PbixLayout,
	reportName: string,
	options: AnalysisOptions = {},
): AnalysisResult {
	const { references, context } = extractRawFieldReferences(layout, reportName);
	const normalised = normaliseFieldReferences(references, {
		...context,
		reportName,
	});

	if (options.includeRaw === true) {
		return {
			raw: references,
			normalised,
		};
	}

	return {
		normalised,
	};
}

/**
 * Compatibility helper for test/debug paths that still require extracted raw references.
 * @param layout Parsed PBIX layout payload used as the extraction source.
 * @param reportName Stable report name to stamp onto each normalised usage row.
 * @returns Analysis output with both raw and normalised arrays present.
 */
export function analyseReportWithRaw(layout: PbixLayout, reportName: string): AnalysisResultWithRaw {
	const result = analyseReport(layout, reportName, { includeRaw: true });
	return {
		raw: result.raw ?? [],
		normalised: result.normalised,
	};
}

/**
 * Run the normalisation pipeline from a pre-extracted ExtractionResult.
 * Use this as the integration entry point when extraction was already performed by
 * `loadPbixExtractionResult()` (which handles both legacy and PBIR formats).
 * @param extractionResult Output of `loadPbixExtractionResult` for the report file.
 * @param reportName Stable report name to stamp onto each normalised usage row.
 * @param options Optional analysis controls.
 * @returns An object containing normalised usage records and optional raw references.
 */
export function analyseFromExtractionResult(
	extractionResult: ExtractionResult,
	reportName: string,
	options: AnalysisOptions = {},
): AnalysisResult {
	const { references, context } = extractionResult;
	const normalised = normaliseFieldReferences(references, {
		...context,
		reportName,
	});

	if (options.includeRaw === true) {
		return {
			raw: references,
			normalised,
		};
	}

	return {
		normalised,
	};
}
