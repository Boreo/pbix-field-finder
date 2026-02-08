// src/core/extraction/field-classifier.ts
// Field classification logic

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
 * Classifies a query reference as a column, measure, calculated, or unknown
 * using the visual's prototype query metadata and pattern matching.
 */
export function classifyField(queryRef: string, prototypeSelect: PrototypeSelectItem[]): FieldKind {
	// "." indicates row/context bindings
	if (queryRef === ".") return "context";

	// Check prototype query first
	const sel = prototypeSelect.find((s) => s.Name === queryRef);
	if (sel?.Aggregation) return "measure";

	// Detect aggregation function patterns
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
