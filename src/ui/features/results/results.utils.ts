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

/**
 * Resolve a user-facing message for a typed PBIX processing error code.
 * @param code Stable PBIX error code emitted by loading and parsing stages.
 * @returns A human-readable error message suitable for UI display.
 */
export function getPbixErrorMessage(code: PbixErrorCode): string {
	return pbixErrorMessageByCode[code];
}

/**
 * Derive a base report name from an uploaded filename.
 * @param fileName Original uploaded filename, typically ending in `.pbix` or `.zip`.
 * @returns A trimmed report label without extension, or `report` when empty.
 */
export function deriveReportName(fileName: string): string {
	const stripped = fileName.replace(/\.(pbix|zip)$/i, "").trim();
	return stripped.length > 0 ? stripped : "report";
}

/**
 * Build a unique report label by appending a numeric suffix for duplicates.
 * @param baseName Base report label before duplicate handling.
 * @param seen Mutable occurrence map keyed by base report label.
 * @returns A unique report label preserving the unsuffixed name for first occurrence.
 */
// First occurrence uses unsuffixed name; duplicates get numeric suffix (-2, -3, etc.).
export function makeUniqueReportName(baseName: string, seen: Map<string, number>): string {
	const current = seen.get(baseName) ?? 0;
	const next = current + 1;
	seen.set(baseName, next);
	return next === 1 ? baseName : `${baseName}-${next}`;
}

/**
 * Count existing loaded files by base report name for deterministic suffixing.
 * @param existingFiles Currently loaded file entries.
 * @returns A map of base report names to their current occurrence counts.
 */
export function createReportNameCounts(existingFiles: LoadedFileEntry[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const file of existingFiles) {
		counts.set(file.baseReportName, (counts.get(file.baseReportName) ?? 0) + 1);
	}
	return counts;
}

/**
 * Merge multiple analysis results into a single aggregate payload.
 * @param results Per-file analysis results to combine into one dataset.
 * @returns A combined result containing concatenated normalised rows and optional raw rows.
 */
export function combineAnalysisResults(results: AnalysisResult[]): AnalysisResult {
	const normalised = results.flatMap((result) => result.normalised);
	const hasRaw = results.some((result) => Array.isArray(result.raw));

	if (!hasRaw) {
		return { normalised };
	}

	return {
		raw: results.flatMap((result) => result.raw ?? []),
		normalised,
	};
}
