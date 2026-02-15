// src/io/pbix-loader.ts
import { parseJsonString } from "../core/json";
import { PbixError } from "../core/errors";
import type { PbixLayout } from "../core/types";

async function loadPbixZip(file: File) {
	try {
		const buffer = await file.arrayBuffer();
		const { default: JSZip } = await import("jszip");
		return await JSZip.loadAsync(buffer);
	} catch (error) {
		throw new PbixError("PBIX_NOT_ZIP", error);
	}
}

// Decompresses a .pbix (ZIP) and returns the parsed layout JSON.
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
