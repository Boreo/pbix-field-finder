// src/core/extraction/field-classifier.ts
// Priority: context -> prototype query (authoritative) -> agg pattern -> expression -> column.

import type { PrototypeSelectItem } from "./raw-field-usage";

/**
 * Field classification based on analysis
 */
export type FieldKind =
	| "column" // Table.Column reference
	| "measure" // Aggregated field from prototype
	| "calculated" // Expression with lineage
	| "context" // "." row context binding
	| "unknown"; // Unable to classify

/**
 * Classify a query reference using prototype metadata and expression heuristics.
 * NOTE: Classification precedence is context binding, prototype aggregation, aggregation pattern, expression, then plain column.
 * @param queryRef Raw query reference from the extraction stage.
 * @param prototypeSelect Prototype query select entries used as the authoritative measure signal when available.
 * @returns The inferred field kind, or `unknown` when no supported pattern matches.
 */
export function classifyField(queryRef: string, prototypeSelect: PrototypeSelectItem[]): FieldKind {
	// "." indicates row/context bindings
	if (queryRef === ".") return "context";

	// Prototype query is the authoritative source for measure detection.
	const sel = prototypeSelect.find((s) => s.Name === queryRef);
	if (sel?.Aggregation) return "measure";

	// Fallback: pattern-match aggregation wrappers for measures outside prototypeQuery.
	const aggPattern = /^(Sum|Count|Average|Min|Max|Distinct|CountRows)\s*\(/i;
	if (aggPattern.test(queryRef)) {
		return "measure";
	}

	// Check for expression (contains parentheses but not an aggregation)
	if (queryRef.includes("(")) return "calculated";

	// Table.Column reference
	if (queryRef.includes(".")) return "column";

	return "unknown";
}
