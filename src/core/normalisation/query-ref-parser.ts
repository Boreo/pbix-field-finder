// src/core/normalisation/query-ref-parser.ts
// Query reference parsing

/**
 * Parsed query reference components
 */
export type ParsedQueryRef = {
	table: string | null;
	field: string | null;
	expression: string | null;
	isExpression: boolean;
};

/**
 * Breaks a query ref string into its bits.
 * Handles the usual suspects: Table.Field, Sum(Table.Field), or weird expressions.
 */
export function parseQueryRef(queryRef: string): ParsedQueryRef {
	// If it's got brackets, it's probably an expression
	if (queryRef.includes("(")) {
		const match = queryRef.match(/([A-Za-z0-9_]+)\.([A-Za-z0-9_ ]+)/);

		if (match) {
			return {
				table: match[1],
				field: match[2],
				expression: queryRef,
				isExpression: true,
			};
		}

		return {
			table: null,
			field: null,
			expression: queryRef,
			isExpression: true,
		};
	}

	// Table.Column pattern
	if (queryRef.includes(".")) {
		const dotIndex = queryRef.indexOf(".");
		return {
			table: queryRef.substring(0, dotIndex),
			field: queryRef.substring(dotIndex + 1),
			expression: null,
			isExpression: false,
		};
	}

	// Fallback - treat as field only
	return {
		table: null,
		field: queryRef,
		expression: null,
		isExpression: false,
	};
}
