// build-pivot.ts
import type { FieldUsageRow, VisualFieldUsage } from "./report-analyser";
import type { FieldKey, Pivot } from "./types";

export function buildPivot(
	rows: FieldUsageRow[],
	usage: VisualFieldUsage[],
): {
	pivot: Pivot;
	pages: string[];
	fieldOrder: FieldKey[];
} {
	const pivot: Pivot = {};
	const pages = new Set<string>();

	const fieldOrder: FieldKey[] = [];
	const seenFields = new Set<FieldKey>();

	for (const r of rows) {
		if (!r.field) continue;
		const report = r.report;
		const table = r.table ?? "(unknown)";
		const field = r.field;
		const page = r.page;

		pages.add(page);

		const key = `${report}|${table}|${field}`;
		if (!seenFields.has(key)) {
			seenFields.add(key);
			fieldOrder.push(key);
		}

		pivot[report] ??= {};
		pivot[report][table] ??= {};
		pivot[report][table][field] ??= {};
		pivot[report][table][field][page] = (pivot[report][table][field][page] ?? 0) + 1;
	}

	// Page ordering from layout
	const pageOrder = new Map<string, number>();
	for (const u of usage) {
		if (!pageOrder.has(u.page)) {
			pageOrder.set(u.page, u.pageIndex);
		}
	}

	const orderedPages = Array.from(pages).sort((a, b) => (pageOrder.get(a) ?? 0) - (pageOrder.get(b) ?? 0));

	return { pivot, pages: orderedPages, fieldOrder };
}
