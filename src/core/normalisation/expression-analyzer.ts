// src/core/normalisation/expression-analyzer.ts
// Why matchAll: a single expression can reference multiple Table.Field pairs.

import type { ExpressionComponents } from "./field-normaliser";

/**
 * Analyse an expression-style query reference to recover table and field lineage.
 * @param queryRef Raw query reference that may contain function-style expressions such as `Sum(Table.Field)`.
 * @returns Expression components for lineage tracking, or null when the query reference is not expression-based.
 */
export function analyseExpression(queryRef: string): ExpressionComponents | null {
	if (!queryRef.includes("(")) return null;

	const tables = new Set<string>();
	const fields: string[] = [];

	// Parse expression for Table.Field patterns
	const matches = queryRef.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_ ]+)/g);
	for (const match of matches) {
		tables.add(match[1]);
		fields.push(match[2]);
	}

	// Extract aggregation type
	const aggMatch = queryRef.match(/^(Sum|Count|Average|Min|Max|Distinct|CountRows)/i);

	return {
		rawExpression: queryRef,
		referencedTables: Array.from(tables),
		referencedFields: fields,
		aggregationType: aggMatch?.[1],
	};
}
