// src/core/normalisation/expression-analyzer.ts
// Expression component tracking

import type { ExpressionComponents } from "./field-normaliser";

/**
 * Breaks down expressions to find which tables and fields they use.
 * Keeps track of what's being referenced so we don't lose the lineage.
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
