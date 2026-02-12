// src/core/normalisation/field-normaliser.ts
// Contract: NormalisedFieldUsage keeps all raw metadata so downstream never
// needs both raw and normalised arrays. Steps: parse -> classify -> analyse.

import type { RawFieldReference, ExtractionContext } from "../extraction/raw-field-usage";
import type { FieldKind } from "../extraction/field-classifier";
import { classifyField } from "../extraction/field-classifier";
import { parseQueryRef } from "./query-ref-parser";
import { analyseExpression } from "./expression-analyzer";

// Rationale: without this, "Sum(Sales.Amount)" loses its link to the Sales table.
export type ExpressionComponents = {
	rawExpression: string;
	referencedTables: string[];
	referencedFields: string[];
	aggregationType?: string; // Sum, Count, etc.
};

/**
 * Normalised field usage record.
 * Represents cleaned, interpreted field usage.
 */
export type NormalisedFieldUsage = {
	// Report context
	report: string;
	page: string;
	pageIndex: number;

	// Visual context
	visualType: string;
	visualId: string;
	visualTitle?: string;
	role: string;

	// Field identity (parsed from queryRef)
	table: string | null;
	field: string | null;

	// Field classification
	fieldKind: FieldKind;

	// Expression tracking
	expression: string | null;
	expressionComponents?: ExpressionComponents;

	// Visibility
	isHiddenVisual: boolean;
	isHiddenFilter: boolean;
};

/**
 * Context for normalisation
 */
export type NormalisationContext = ExtractionContext & {
	reportName: string;
};

/**
 * Normalise raw field references into canonical usage records for downstream projections.
 * NOTE: Missing visibility flags in raw references default to `false` in the returned rows.
 * @param rawReferences Raw references emitted by extraction, including visual and filter metadata.
 * @param context Normalisation context carrying report identity and page-order metadata.
 * @returns Normalised usage rows with parsed identity, classification, and optional expression lineage.
 */
export function normaliseFieldReferences(
	rawReferences: RawFieldReference[],
	context: NormalisationContext,
): NormalisedFieldUsage[] {
	const normalised = rawReferences.map((ref) => {
		// Parse query reference into components
		const parsed = parseQueryRef(ref.queryRef);

		// Classify field based on prototype metadata and patterns
		const fieldKind = classifyField(ref.queryRef, ref.prototypeSelect ?? []);

		// Analyse expression if present
		const expressionComponents = parsed.isExpression ? analyseExpression(ref.queryRef) : undefined;

		return {
			// Report context
			report: context.reportName,
			page: ref.pageName,
			pageIndex: ref.pageIndex,

			// Visual context
			visualType: ref.visualType,
			visualId: ref.visualId,
			visualTitle: ref.visualTitle,
			role: ref.role,

			// Field identity
			table: parsed.table,
			field: parsed.field,

			// Classification
			fieldKind,

			// Expression tracking
			expression: parsed.expression,
			expressionComponents: expressionComponents ?? undefined,

			// Visibility
			isHiddenVisual: ref.isHiddenVisual ?? false,
			isHiddenFilter: ref.isHiddenFilter ?? false,
		};
	});

	return normalised;
}
