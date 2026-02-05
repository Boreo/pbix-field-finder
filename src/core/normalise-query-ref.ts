// normalise-query-ref.ts

export type NormalisedQueryRef = {
	table: string | null;
	field: string | null;
	expression: string | null;
};

// Normalises a query reference into table, field, and expression components for relational analysis.
export function normaliseQueryRef(queryRef: string): NormalisedQueryRef {
	const q = queryRef.trim();

	// Power BI sentinel / junk refs
	if (q === "." || q.endsWith("..")) {
		return {
			table: null,
			field: null,
			expression: null,
		};
	}
	// Expression (measure or calc)
	if (q.includes("(")) {
		const m = q.match(/([A-Za-z0-9_]+)\.([A-Za-z0-9_ ]+)/);
		return {
			table: m?.[1] ?? null,
			field: m?.[2]?.trim() ?? null,
			expression: q,
		};
	}

	// Table.Column
	const dotIndex = q.indexOf(".");
	if (dotIndex > 0) {
		return {
			table: q.slice(0, dotIndex),
			field: q.slice(dotIndex + 1).trim(),
			expression: null,
		};
	}

	// Fallback
	return {
		table: null,
		field: q,
		expression: null,
	};
}
