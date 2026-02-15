// src/io/data-export.ts
import { buildDetailsRows, toCanonicalUsageRows, type SummaryRow } from "../core/projections";
import type { NormalisedFieldUsage } from "../core/normalisation/field-normaliser";

type PapaModule = typeof import("papaparse");

let papaModulePromise: Promise<PapaModule> | null = null;

function getPapaModule(): Promise<PapaModule> {
	if (!papaModulePromise) {
		papaModulePromise = import("papaparse");
	}
	return papaModulePromise;
}

// Strips characters that are illegal on Windows/macOS/Linux filesystems.
function safeReportName(reportName: string): string {
	const sanitised = reportName
		.trim()
		.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
		.replace(/\.+$/g, "")
		.replace(/\s+/g, " ");

	return sanitised.length > 0 ? sanitised : "report";
}

function normaliseCsvValue(value: unknown): string | number | boolean | null {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return value;
	}
	return JSON.stringify(value);
}

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

export function exportSummaryJson(rows: SummaryRow[], scopeLabel: string): void {
	const json = JSON.stringify(rows, null, 2);
	downloadTextFile(`${safeReportName(scopeLabel)}-summary.json`, json, "application/json");
}

export function exportDetailsJson(normalisedRows: NormalisedFieldUsage[], scopeLabel: string): void {
	const detailsRows = buildDetailsRows(toCanonicalUsageRows(normalisedRows));
	const json = JSON.stringify(detailsRows, null, 2);
	downloadTextFile(`${safeReportName(scopeLabel)}-details.json`, json, "application/json");
}

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
		"expressionComponents",
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
		expressionComponents: row.expressionComponents ?? null,
		isHiddenVisual: row.isHiddenVisual,
		isHiddenFilter: row.isHiddenFilter,
	}));

	const csv = await toCsvWithColumns(columns, csvRows);
	downloadTextFile(`${safeReportName(scopeLabel)}-raw.csv`, csv, "text/csv");
}

export function exportRawCsv(rows: NormalisedFieldUsage[], scopeLabel: string): void {
	void exportRawCsvAsync(rows, scopeLabel);
}
