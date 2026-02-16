// src/core/normalisation/field-normaliser.ts
// Contract: NormalisedFieldUsage keeps all raw metadata so downstream never
// needs both raw and normalised arrays. Steps: parse -> classify.

import type { RawFieldReference, ExtractionContext } from "../extraction/raw-field-usage";
import type { FieldKind } from "../extraction/field-classifier";
import { classifyField } from "../extraction/field-classifier";
import { parseQueryRef } from "./query-ref-parser";

/**
 * Normalised field usage record.
 * Represents cleaned, interpreted field usage.
 */
export type NormalisedFieldUsage = {
	report: string;
	page: string;
	pageIndex: number;

	visualType: string;
	visualId: string;
	visualTitle?: string;
	role: string;

	table: string | null;
	field: string | null;

	fieldKind: FieldKind;

	expression: string | null;

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
		// Pipeline step 1: Parse queryRef into table, field, and optional expression components.
		const parsed = parseQueryRef(ref.queryRef);
		// Pipeline step 2: Classify field using prototype metadata and pattern matching.
		const fieldKind = classifyField(ref.queryRef, ref.prototypeSelect ?? []);

		return {
			report: context.reportName,
			page: ref.pageName,
			pageIndex: ref.pageIndex,

			visualType: ref.visualType,
			visualId: ref.visualId,
			visualTitle: ref.visualTitle,
			role: ref.role,

			table: parsed.table,
			field: parsed.field,

			fieldKind,

			expression: parsed.expression,

			isHiddenVisual: ref.isHiddenVisual ?? false,
			isHiddenFilter: ref.isHiddenFilter ?? false,
		};
	});

	return normalised;
}
