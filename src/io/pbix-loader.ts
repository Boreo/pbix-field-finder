// src/io/pbix-loader.ts
import { parseJsonString } from "@/core/json";
import { PbixError } from "@/core/errors";
import type { PbixLayout } from "@/core/types";
import type { ExtractionResult } from "@/core/extraction/raw-field-usage";
import { extractRawFieldReferences } from "@/core/extraction/raw-field-usage";
import { extractPbirRawFieldReferences } from "@/core/extraction/pbir-raw-field-usage";

/**
 * Load a PBIX file as a ZIP archive for downstream layout extraction.
 * @param file Browser `File` object for a `.pbix` payload selected by the user.
 * @returns A loaded ZIP instance ready for file lookups within the PBIX container.
 * @throws {PbixError} Throws `PBIX_NOT_ZIP` when the file cannot be read as a valid ZIP archive.
 */
async function loadPbixZip(file: File) {
	try {
		const buffer = await file.arrayBuffer();
		const { default: JSZip } = await import("jszip");
		return await JSZip.loadAsync(buffer);
	} catch (error) {
		throw new PbixError("PBIX_NOT_ZIP", error);
	}
}

/**
 * Parse the legacy PBIX layout document from an already-loaded ZIP.
 * Internal helper shared between loadPbixLayout and loadPbixExtractionResult.
 */
async function loadLegacyLayoutFromZip(
	zip: Awaited<ReturnType<typeof loadPbixZip>>,
): Promise<PbixLayout> {
	// Older PBIX files use "Report/Layout"; newer ones use "Report/Layout.json".
	const layoutFile = zip.file("Report/Layout") ?? zip.file("Report/Layout.json");
	if (!layoutFile) {
		throw new PbixError("LAYOUT_NOT_FOUND");
	}

	let layoutText: string;
	try {
		const layoutBuffer = await layoutFile.async("arraybuffer");
		const decoder = new TextDecoder("utf-16le");
		layoutText = decoder.decode(layoutBuffer);
	} catch (error) {
		throw new PbixError("LAYOUT_DECODE_FAILED", error);
	}

	const parsedLayout = parseJsonString<PbixLayout>(layoutText);
	if (!parsedLayout.ok) {
		throw new PbixError("LAYOUT_PARSE_FAILED", parsedLayout.error);
	}

	return parsedLayout.value;
}

/**
 * Load and parse the Power BI layout document from a PBIX file.
 * @param file Browser `File` object for the uploaded PBIX report.
 * @returns The parsed layout payload used by the analysis pipeline.
 * @throws {PbixError} Throws a typed PBIX error when ZIP loading, layout decode, or layout parsing fails.
 */
export async function loadPbixLayout(file: File): Promise<PbixLayout> {
	const zip = await loadPbixZip(file);
	return loadLegacyLayoutFromZip(zip);
}

/**
 * Detect whether a loaded ZIP is a PBIR-format archive.
 * PBIR stores report definition under Report/definition/ instead of a flat Layout file.
 */
function isPbirFormat(zip: Awaited<ReturnType<typeof loadPbixZip>>): boolean {
	return zip.file("Report/definition/report.json") !== null;
}

/**
 * Load a PBIX file and extract raw field references, handling both legacy and PBIR formats.
 * This is the recommended entry point for the analysis pipeline; it replaces the two-step
 * `loadPbixLayout` + `extractRawFieldReferences` call in integration points.
 *
 * @param file Browser `File` object for the uploaded PBIX report.
 * @param reportName Optional report name used for report-level filter sentinel labels.
 * @returns Raw field references and extraction context, ready for normalisation.
 * @throws {PbixError} Throws a typed error when ZIP loading, layout decode, or JSON parsing fails.
 */
export async function loadPbixExtractionResult(
	file: File,
	reportName?: string,
): Promise<ExtractionResult> {
	const zip = await loadPbixZip(file);

	if (isPbirFormat(zip)) {
		return extractPbirRawFieldReferences(zip, reportName);
	}

	// Legacy path: reuse the already-loaded zip to avoid loading the file twice.
	const layout = await loadLegacyLayoutFromZip(zip);
	return extractRawFieldReferences(layout, reportName);
}
