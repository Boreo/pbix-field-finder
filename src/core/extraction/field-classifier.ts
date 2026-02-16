// src/core/extraction/field-classifier.ts
// Priority: context -> prototype kind -> aggregation pattern -> expression -> table field.

import type { PrototypeSelectItem } from "./raw-field-usage";

/**
 * Normalised field-kind categories used by downstream projections.
 */
export type FieldKind =
	| "column" // Table.Column reference
	| "measure" // Aggregated field from prototype
	| "context" // "." row context binding
	| "unknown"; // Unable to classify

const AGGREGATION_FUNCTION_PATTERN =
	/^(Sum|Count|Average|Min|Max|DistinctCount|Distinct|CountRows|CountNonNull|StDev|StDevP|Var|VarP)\s*\(/i;

/**
 * Detect a direct table/field query reference such as `Sales.Country`.
 */
function isTableFieldReference(queryRef: string): boolean {
	const dotIndex = queryRef.indexOf(".");
	return dotIndex > 0 && dotIndex < queryRef.length - 1;
}

/**
 * Classify a query reference using prototype metadata plus shape-based fallbacks.
 * NOTE: When prototype metadata exists and is specific (not `unknown`), it wins.
 * Otherwise the classifier falls back to expression and `Table.Field` patterns.
 * @param queryRef Raw query reference from the extraction stage.
 * @param prototypeSelect Prototype query select entries from the visual config.
 * @returns The inferred field kind, or `unknown` when no supported pattern matches.
 */
// Priority cascade: context sentinel → prototype metadata → aggregation pattern → parentheses → table.field structure.
export function classifyField(queryRef: string, prototypeSelect: PrototypeSelectItem[]): FieldKind {
	const trimmedRef = queryRef.trim();
	// Priority 1: Row context sentinel.
	if (trimmedRef === ".") return "context";

	// Priority 2: Prototype query metadata (authoritative when present and not 'unknown').
	const prototypeMatch = prototypeSelect.find((item) => item.Name.trim() === trimmedRef);
	if (prototypeMatch && prototypeMatch.kind !== "unknown") {
		return prototypeMatch.kind;
	}

	// Priority 3: Schema-defined aggregation functions (Sum, Count, Average, etc.).
	if (AGGREGATION_FUNCTION_PATTERN.test(trimmedRef)) {
		return "measure";
	}

	// Priority 4: Fallback expression detection via parentheses.
	if (trimmedRef.includes("(") || trimmedRef.includes(")")) {
		return "measure";
	}

	// Priority 5: Direct table.field reference structure.
	if (isTableFieldReference(trimmedRef)) {
		return "column";
	}

	return "unknown";
}
