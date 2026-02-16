// src/core/normalisation/query-ref-parser.ts
// Caveat: Power BI allows spaces in field names.

export type ParsedQueryRef = {
	table: string | null;
	field: string | null;
	expression: string | null;
	isExpression: boolean;
};

// Regex pattern allows spaces in field names per Power BI schema rules.
const TABLE_FIELD_PATTERN = /([A-Za-z0-9_]+)\.([A-Za-z0-9_ ]+)/;

/**
 * Normalise a parsed query-ref segment by trimming whitespace and dropping empty values.
 * @param value Raw table or field segment extracted from a query reference.
 * @returns The trimmed segment, or null when the segment is empty after trimming.
 */
function normaliseSegment(value: string): string | null {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parse a query reference into table, field, and expression components.
 * @param queryRef Raw query reference from extraction, including `Table.Field` and expression forms.
 * @returns Parsed query-ref parts with `isExpression` indicating whether expression parsing rules were applied.
 */
export function parseQueryRef(queryRef: string): ParsedQueryRef {
	const trimmedRef = queryRef.trim();

	// Branch 1: Expression form (contains function call parentheses).
	if (trimmedRef.includes("(")) {
		const match = trimmedRef.match(TABLE_FIELD_PATTERN);
		if (!match) {
			return {
				table: null,
				field: null,
				expression: trimmedRef,
				isExpression: true,
			};
		}

		return {
			table: normaliseSegment(match[1]),
			field: normaliseSegment(match[2]),
			expression: trimmedRef,
			isExpression: true,
		};
	}

	// Branch 2: Direct table.field reference form.
	const dotIndex = trimmedRef.indexOf(".");
	if (dotIndex > 0 && dotIndex < trimmedRef.length - 1) {
		return {
			table: normaliseSegment(trimmedRef.slice(0, dotIndex)),
			field: normaliseSegment(trimmedRef.slice(dotIndex + 1)),
			expression: null,
			isExpression: false,
		};
	}

	// Branch 3: Standalone field reference (no table qualifier).
	return {
		table: null,
		field: normaliseSegment(trimmedRef),
		expression: null,
		isExpression: false,
	};
}
