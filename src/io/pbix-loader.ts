// src/io/pbix-loader.ts
import { parseJsonString } from "../core/json";
import { PbixError } from "../core/errors";
import type { PbixLayout } from "../core/types";

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
 * Load and parse the Power BI layout document from a PBIX file.
 * @param file Browser `File` object for the uploaded PBIX report.
 * @returns The parsed layout payload used by the analysis pipeline.
 * @throws {PbixError} Throws a typed PBIX error when ZIP loading, layout decode, or layout parsing fails.
 */
export async function loadPbixLayout(file: File): Promise<PbixLayout> {
	const zip = await loadPbixZip(file);

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
