import Papa from "papaparse";
import type { NormalisedFieldUsage } from "../core/normalisation/field-normaliser";
import type { FieldUsageAggregation } from "../core/aggregation/field-aggregator";
import { serializeFieldUsageAggregation } from "../core/aggregation/serialization";

/* Normalises the report name so downloaded filenames are valid across platforms. */
function safeReportName(reportName: string): string {
	const santised = reportName
		.trim()
		.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
		.replace(/\.+$/g, "")
		.replace(/\s+/g, " ");

	return santised.length > 0 ? santised : "report";
}

/* Converts values into CSV-safe primitives before passing them to Papa Parse. */
function normaliseCsvValue(value: unknown): string | number | boolean | null {
	if (value === undefined) return null;
	if (value === null) return null;
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
	return JSON.stringify(value);
}

/* Builds CSV text from a fixed column list to keep column ordering stable. */
function toCsvWithColumns(columns: string[], rows: Array<Record<string, unknown>>): string {
	const data = rows.map((row) => columns.map((column) => normaliseCsvValue(row[column])));
	return Papa.unparse(
		{
			fields: columns,
			data,
		},
		{
			newline: "\n",
		},
	);
}

/* Triggers a browser download for text content via a Blob URL. */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
	const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");

	link.href = url;
	link.download = filename;
	link.style.display = "none";

	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

/* Converts row objects to CSV, using the first row's keys as headers. */
export function toCsv(rows: Array<Record<string, unknown>>): string {
	if (rows.length === 0) return "";
	const columns = Object.keys(rows[0]);
	const normalisedRows = rows.map((row) =>
		Object.fromEntries(columns.map((column) => [column, normaliseCsvValue(row[column])])),
	);

	return Papa.unparse(normalisedRows, { newline: "\n" });
}

/* Exports cleaned raw usage records to CSV using a fixed schema. */
export function exportRawCsv(normalised: NormalisedFieldUsage[], reportName: string): void {
	const columns = [
		"report",
		"page",
		"pageIndex",
		"visualType",
		"visualId",
		"visualTitle",
		"role",
		"table",
		"field",
		"fieldKind",
		"expression",
		"aggregationType",
		"referencedTables",
		"referencedFields",
		"isHiddenVisual",
		"isHiddenFilter",
	];

	const rows = normalised.map((usage) => ({
		report: usage.report,
		page: usage.page,
		pageIndex: usage.pageIndex,
		visualType: usage.visualType,
		visualId: usage.visualId,
		visualTitle: usage.visualTitle ?? "",
		role: usage.role,
		table: usage.table ?? "",
		field: usage.field ?? "",
		fieldKind: usage.fieldKind,
		expression: usage.expression ?? "",
		aggregationType: usage.expressionComponents?.aggregationType ?? "",
		referencedTables: usage.expressionComponents?.referencedTables.join("|") ?? "",
		referencedFields: usage.expressionComponents?.referencedFields.join("|") ?? "",
		isHiddenVisual: usage.isHiddenVisual,
		isHiddenFilter: usage.isHiddenFilter,
	}));

	const csv = toCsvWithColumns(columns, rows);
	downloadTextFile(`${safeReportName(reportName)}-raw.csv`, csv, "text/csv");
}

/* Exports cleaned raw usage records as pretty-printed JSON. */
export function exportRawJson(normalised: NormalisedFieldUsage[], reportName: string): void {
	const json = JSON.stringify(normalised, null, 2);
	downloadTextFile(`${safeReportName(reportName)}-raw.json`, json, "application/json");
}

/* Backward-compatible alias for raw CSV export. */
export const exportNormalisedCsv = exportRawCsv;

/* Backward-compatible alias for raw JSON export. */
export const exportNormalisedJson = exportRawJson;

/* Flattens aggregated field stats into one CSV row per field and downloads it. */
export function exportAggregatedCsv(aggregation: FieldUsageAggregation, reportName: string): void {
	const serialised = serializeFieldUsageAggregation(aggregation);
	const columns = [
		"report",
		"table",
		"field",
		"fieldKey",
		"fieldKind",
		"expression",
		"totalUsages",
		"hasVisibleUsages",
		"hasHiddenUsages",
		"hiddenUsageCount",
		"pageCount",
		"pageNames",
		"usagesByPageJson",
		"usagesByRoleJson",
		"usagesByVisualTypeJson",
	];

	const rows = serialised.fields.map((field) => {
		const pages = Object.values(field.usagesByPage).sort((a, b) => a.pageIndex - b.pageIndex);

		return {
			report: field.report,
			table: field.table,
			field: field.field,
			fieldKey: field.fieldKey,
			fieldKind: field.fieldKind,
			expression: field.expression ?? "",
			totalUsages: field.totalUsages,
			hasVisibleUsages: field.hasVisibleUsages,
			hasHiddenUsages: field.hasHiddenUsages,
			hiddenUsageCount: field.hiddenUsageCount,
			pageCount: pages.length,
			pageNames: pages.map((page) => page.pageName).join("|"),
			usagesByPageJson: JSON.stringify(field.usagesByPage),
			usagesByRoleJson: JSON.stringify(field.usagesByRole),
			usagesByVisualTypeJson: JSON.stringify(field.usagesByVisualType),
		};
	});

	const csv = toCsvWithColumns(columns, rows);
	downloadTextFile(`${safeReportName(reportName)}-aggregated.csv`, csv, "text/csv");
}

/* Exports serialised aggregated output as pretty-printed JSON. */
export function exportAggregatedJson(aggregation: FieldUsageAggregation, reportName: string): void {
	const serialised = serializeFieldUsageAggregation(aggregation);
	const json = JSON.stringify(serialised, null, 2);
	downloadTextFile(`${safeReportName(reportName)}-aggregated.json`, json, "application/json");
}
