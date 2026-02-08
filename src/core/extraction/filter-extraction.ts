// src/core/extraction/filter-extraction.ts
// Filter parsing utility

/**
 * Filter reference with metadata
 */
export type FilterRef = {
	queryRef: string;
	hidden: boolean;
};

/**
 * Parses visual, page, or report filters to extract query references.
 */
export function extractFilterRefs(filters: unknown): FilterRef[] {
	if (typeof filters !== "string") return [];

	try {
		const parsed = JSON.parse(filters);
		if (!Array.isArray(parsed)) return [];

		const refs: FilterRef[] = [];

		for (const f of parsed) {
			const expr = f?.expression;
			if (!expr) continue;

			const hidden = f?.isHiddenInViewMode === true;
			let queryRef: string | null = null;

			// Column filter
			if (expr.Column?.Property && expr.Column?.Expression?.SourceRef?.Entity) {
				queryRef = `${expr.Column.Expression.SourceRef.Entity}.${expr.Column.Property}`;
			}

			// Aggregation / measure-like filter
			if (
				expr.Aggregation?.Expression?.Column?.Property &&
				expr.Aggregation?.Expression?.Column?.Expression?.SourceRef?.Entity
			) {
				queryRef = `Sum(${expr.Aggregation.Expression.Column.Expression.SourceRef.Entity}.${expr.Aggregation.Expression.Column.Property})`;
			}

			if (queryRef) {
				refs.push({ queryRef, hidden });
			}
		}

		return refs;
	} catch {
		return [];
	}
}
