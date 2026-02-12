// src/core/extraction/filter-extraction.ts
// Caveat: PBIX filters come as JSON strings with two shapes (Column and Aggregation).

import { parseJsonString } from "../json";
import type { PbixColumnExpression, PbixFilter } from "../types";

export type FilterRef = {
	queryRef: string;
	hidden: boolean;
};

/**
 * Read a `Table.Field` query reference from a column expression node.
 * @param column Column expression node from a parsed PBIX filter expression.
 * @returns A query reference in `Entity.Property` format, or null when either segment is missing.
 */
function readColumnQueryRef(column: PbixColumnExpression | undefined): string | null {
	const property = column?.Property;
	const entity = column?.Expression?.SourceRef?.Entity;
	if (!property || !entity) {
		return null;
	}
	return `${entity}.${property}`;
}

/**
 * Extract field references from visual, page, or report filter JSON.
 * @param filters JSON string from PBIX filter payloads, or undefined when no filters are configured.
 * @returns Filter references with hidden-state flags, excluding malformed entries that cannot be parsed safely.
 */
export function extractFilterRefs(filters: string | undefined): FilterRef[] {
	if (!filters) {
		return [];
	}

	const parsed = parseJsonString<unknown>(filters);
	if (!parsed.ok || !Array.isArray(parsed.value)) {
		return [];
	}

	const refs: FilterRef[] = [];

	for (const filter of parsed.value as PbixFilter[]) {
		const expression = filter?.expression;
		if (!expression) {
			continue;
		}

		const hidden = filter?.isHiddenInViewMode === true;

		const columnRef = readColumnQueryRef(expression.Column);
		if (columnRef) {
			refs.push({ queryRef: columnRef, hidden });
			continue;
		}

		const aggregatedColumnRef = readColumnQueryRef(expression.Aggregation?.Expression?.Column);
		if (aggregatedColumnRef) {
			refs.push({ queryRef: `Sum(${aggregatedColumnRef})`, hidden });
		}
	}

	return refs;
}
