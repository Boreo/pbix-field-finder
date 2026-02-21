// src/core/extraction/pbir-filter-extraction.ts
// PBIR filters use field.Column / field.Measure / field.Aggregation instead of legacy expression.*.

import type { PbirColumnExpr, PbirFilterConfig, PbirMeasureExpr } from "../types/pbir";
import type { FilterRef } from "./filter-extraction";

/**
 * Read a `Entity.Property` query reference from a PBIR column or measure expression node.
 */
function readPbirSimpleQueryRef(expr: PbirColumnExpr | PbirMeasureExpr | undefined): string | null {
	const property = expr?.Property;
	const entity = expr?.Expression?.SourceRef?.Entity;
	if (!property || !entity) {
		return null;
	}
	return `${entity}.${property}`;
}

/**
 * Extract field references from a PBIR filterConfig object.
 * Handles three field shapes: Column, Measure, and Aggregation.
 * @param filterConfig Parsed PBIR filterConfig object from a visual, page, or report JSON.
 * @returns Filter references with hidden-state flags, excluding malformed entries.
 */
export function extractPbirFilterRefs(filterConfig: PbirFilterConfig | undefined): FilterRef[] {
	if (!filterConfig?.filters?.length) {
		return [];
	}

	const refs: FilterRef[] = [];

	for (const filter of filterConfig.filters) {
		const field = filter?.field;
		if (!field) {
			continue;
		}

		const hidden = filter.isHiddenInViewMode === true;

		// Shape 1: Direct column reference (field.Column.Expression.SourceRef.Entity + field.Column.Property).
		const columnRef = readPbirSimpleQueryRef(field.Column);
		if (columnRef) {
			refs.push({ queryRef: columnRef, hidden });
			continue;
		}

		// Shape 2: Measure reference (field.Measure.Expression.SourceRef.Entity + field.Measure.Property).
		const measureRef = readPbirSimpleQueryRef(field.Measure);
		if (measureRef) {
			refs.push({ queryRef: measureRef, hidden });
			continue;
		}

		// Shape 3: Aggregation wrapping a column (field.Aggregation.Expression.Column).
		const aggregatedColumnRef = readPbirSimpleQueryRef(field.Aggregation?.Expression?.Column);
		if (aggregatedColumnRef) {
			refs.push({ queryRef: `Sum(${aggregatedColumnRef})`, hidden });
		}
	}

	return refs;
}
