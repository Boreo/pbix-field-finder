// src/io/data-export.ts
import { buildDetailsRows, toCanonicalUsageRows, type SummaryRow } from "../core/projections";
import type { NormalisedFieldUsage } from "../core/normalisation/field-normaliser";

type PapaModule = typeof import("papaparse");

let papaModulePromise: Promise<PapaModule> | null = null;

/**
 * Load and cache the Papa Parse module used for CSV serialisation.
 * @returns A shared module promise so repeated exports do not trigger duplicate dynamic imports.
 */
function getPapaModule(): Promise<PapaModule> {
	if (!papaModulePromise) {
		papaModulePromise = import("papaparse");
	}
	return papaModulePromise;
}

/**
 * Normalise a report label into a cross-platform safe filename stem.
 * @param reportName User-facing report label used to build export filenames.
 * @returns A sanitised filename segment, or `report` when the label becomes empty.
 */
function safeReportName(reportName: string): string {
	const sanitised = reportName
		.trim()
		.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
		.replace(/\.+$/g, "")
		.replace(/\s+/g, " ");

	return sanitised.length > 0 ? sanitised : "report";
}

/**
 * Normalise values into scalar CSV-safe cells.
 * NOTE: Objects and arrays are JSON-stringified to preserve readable content in a single CSV field.
 * @param value Raw row value before CSV serialisation.
 * @returns A scalar CSV cell value, or `null` when the input is nullish.
 */
function normaliseCsvValue(value: unknown): string | number | boolean | null {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return value;
	}
	return JSON.stringify(value);
}

/**
 * Serialise tabular rows into CSV using a fixed column order.
 * @param columns Ordered output columns for the CSV header and row mapping.
 * @param rows Data rows keyed by column name.
 * @returns CSV text with Unix newlines for predictable downloads across platforms.
 */
async function toCsvWithColumns(columns: string[], rows: Array<Record<string, unknown>>): Promise<string> {
	const data = rows.map((row) => columns.map((column) => normaliseCsvValue(row[column])));
	const { default: Papa } = await getPapaModule();
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

/**
 * Trigger a browser download for generated text content.
 * WARNING: This writes to browser URL/object APIs and performs a synthetic click side effect.
 * @param filename Download filename presented to the browser.
 * @param content Text payload to place into the downloaded file.
 * @param mimeType MIME type prefix for the generated blob.
 * @returns Nothing; the function initiates a client-side download.
 */
function downloadTextFile(filename: string, content: string, mimeType: string): void {
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

/**
 * Export grouped summary rows as a formatted JSON download.
 * @param rows Summary projection rows already prepared for UI display.
 * @param scopeLabel Dataset label used as the filename prefix.
 * @returns Nothing; the function triggers a browser file download.
 */
export function exportSummaryJson(rows: SummaryRow[], scopeLabel: string): void {
	const json = JSON.stringify(rows, null, 2);
	downloadTextFile(`${safeReportName(scopeLabel)}-summary.json`, json, "application/json");
}

/**
 * Export detail rows as a formatted JSON download.
 * @param normalisedRows Normalised usage rows that will be projected into detail rows before export.
 * @param scopeLabel Dataset label used as the filename prefix.
 * @returns Nothing; the function triggers a browser file download.
 */
export function exportDetailsJson(normalisedRows: NormalisedFieldUsage[], scopeLabel: string): void {
	const detailsRows = buildDetailsRows(toCanonicalUsageRows(normalisedRows));
	const json = JSON.stringify(detailsRows, null, 2);
	downloadTextFile(`${safeReportName(scopeLabel)}-details.json`, json, "application/json");
}

/**
 * Build and export raw usage rows as CSV text.
 * @param rows Normalised field-usage rows to flatten into CSV columns.
 * @param scopeLabel Dataset label used as the filename prefix.
 * @returns A promise that resolves once CSV generation and download triggering complete.
 */
async function exportRawCsvAsync(rows: NormalisedFieldUsage[], scopeLabel: string): Promise<void> {
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
		"isHiddenVisual",
		"isHiddenFilter",
	];

	const csvRows = rows.map((row) => ({
		report: row.report,
		page: row.page,
		pageIndex: row.pageIndex,
		visualType: row.visualType,
		visualId: row.visualId,
		visualTitle: row.visualTitle ?? "",
		role: row.role,
		table: row.table,
		field: row.field,
		fieldKind: row.fieldKind,
		expression: row.expression,
		isHiddenVisual: row.isHiddenVisual,
		isHiddenFilter: row.isHiddenFilter,
	}));

	const csv = await toCsvWithColumns(columns, csvRows);
	downloadTextFile(`${safeReportName(scopeLabel)}-raw.csv`, csv, "text/csv");
}

/**
 * Export raw usage rows as CSV without exposing async handling to UI callers.
 * WARNING: Any async failure is intentionally unhandled at this boundary to keep the click handler synchronous.
 * @param rows Normalised field-usage rows to export.
 * @param scopeLabel Dataset label used as the filename prefix.
 * @returns Nothing; the function schedules async CSV export work.
 */
export function exportRawCsv(rows: NormalisedFieldUsage[], scopeLabel: string): void {
	void exportRawCsvAsync(rows, scopeLabel);
}
