// src/ui/features/results/results.utils.ts
import type { PbixErrorCode } from "../../../core/errors";
import type { AnalysisResult } from "../../../core/report-analyser";
import type { LoadedFileEntry } from "./workflow.types";

const pbixErrorMessageByCode: Record<PbixErrorCode, string> = {
	PBIX_NOT_ZIP: "The selected file is not a valid PBIX file.",
	LAYOUT_NOT_FOUND: "The PBIX file does not contain a report layout.",
	LAYOUT_DECODE_FAILED: "The report layout could not be decoded.",
	LAYOUT_PARSE_FAILED: "The report layout is corrupted.",
};

export function getPbixErrorMessage(code: PbixErrorCode): string {
	return pbixErrorMessageByCode[code];
}

export function deriveReportName(fileName: string): string {
	const stripped = fileName.replace(/\.(pbix|zip)$/i, "").trim();
	return stripped.length > 0 ? stripped : "report";
}

export function makeUniqueReportName(baseName: string, seen: Map<string, number>): string {
	const current = seen.get(baseName) ?? 0;
	const next = current + 1;
	seen.set(baseName, next);
	return next === 1 ? baseName : `${baseName}-${next}`;
}

export function createReportNameCounts(existingFiles: LoadedFileEntry[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const file of existingFiles) {
		counts.set(file.baseReportName, (counts.get(file.baseReportName) ?? 0) + 1);
	}
	return counts;
}

export function combineAnalysisResults(results: AnalysisResult[]): AnalysisResult {
	return {
		raw: results.flatMap((result) => result.raw),
		normalised: results.flatMap((result) => result.normalised),
	};
}
