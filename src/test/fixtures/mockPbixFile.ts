type MockPbixLayoutPath = "Report/Layout" | "Report/Layout.json";

type MockPbixFileOptions = {
	fileName?: string;
	layoutPath?: MockPbixLayoutPath;
	additionalEntries?: Record<string, string>;
};

function encodeUtf16Le(text: string): Uint8Array {
	const bytes = new Uint8Array(text.length * 2);
	for (let index = 0; index < text.length; index += 1) {
		const codeUnit = text.charCodeAt(index);
		bytes[index * 2] = codeUnit & 0xff;
		bytes[index * 2 + 1] = codeUnit >> 8;
	}
	return bytes;
}

function attachArrayBufferMethod(file: File, bufferFactory: () => ArrayBuffer): File {
	if (typeof file.arrayBuffer === "function") {
		return file;
	}

	Object.defineProperty(file, "arrayBuffer", {
		configurable: true,
		value: async () => bufferFactory(),
	});

	return file;
}

export function createPbixFileFromBuffer(buffer: ArrayBuffer, fileName = "test.pbix"): File {
	const file = new File([buffer], fileName, {
		type: "application/octet-stream",
	});
	return attachArrayBufferMethod(file, () => buffer.slice(0));
}

export async function createMockZipBuffer(entries: Record<string, string>): Promise<ArrayBuffer> {
	const { default: JSZip } = await import("jszip");
	const zip = new JSZip();

	for (const [path, content] of Object.entries(entries)) {
		const shouldEncodeAsUtf16Le = path === "Report/Layout" || path === "Report/Layout.json";
		zip.file(path, shouldEncodeAsUtf16Le ? encodeUtf16Le(content) : content);
	}

	const zipBytes = await zip.generateAsync({ type: "uint8array" });
	return zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength) as ArrayBuffer;
}

export async function createMockPbixFile(
	layoutJson: string,
	options: MockPbixFileOptions = {},
): Promise<File> {
	const {
		fileName = "test.pbix",
		layoutPath = "Report/Layout",
		additionalEntries = {},
	} = options;

	const buffer = await createMockZipBuffer({
		[layoutPath]: layoutJson,
		...additionalEntries,
	});

	return createPbixFileFromBuffer(buffer, fileName);
}

export function createInvalidPbixFile(contents = "not a zip", fileName = "invalid.pbix"): File {
	const bytes = new TextEncoder().encode(contents);
	return createPbixFileFromBuffer(
		bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
		fileName,
	);
}

// ─── PBIR mock helpers ───────────────────────────────────────────────────────

type MockPbirVisual = {
	id: string;
	visual: object;
};

type MockPbirPage = {
	id: string;
	page: object;
	visuals?: MockPbirVisual[];
};

type MockPbirFileOptions = {
	fileName?: string;
};

/**
 * Create a mock PBIR-format PBIX file suitable for unit tests.
 * Produces a ZIP with the Report/definition/ folder structure.
 * All files are UTF-8 JSON (no UTF-16LE encoding needed for PBIR).
 */
export async function createMockPbirFile(
	pages: MockPbirPage[],
	report: object = {},
	options: MockPbirFileOptions = {},
): Promise<File> {
	const { fileName = "test-pbir.pbix" } = options;
	const { default: JSZip } = await import("jszip");
	const zip = new JSZip();

	const pageIds = pages.map((p) => p.id);
	const pagesJson = { pageOrder: pageIds };
	zip.file("Report/definition/pages/pages.json", JSON.stringify(pagesJson));
	zip.file("Report/definition/report.json", JSON.stringify(report));

	for (const page of pages) {
		zip.file(
			`Report/definition/pages/${page.id}/page.json`,
			JSON.stringify(page.page),
		);
		for (const visual of page.visuals ?? []) {
			zip.file(
				`Report/definition/pages/${page.id}/visuals/${visual.id}/visual.json`,
				JSON.stringify(visual.visual),
			);
		}
	}

	const zipBytes = await zip.generateAsync({ type: "uint8array" });
	const buffer = zipBytes.buffer.slice(
		zipBytes.byteOffset,
		zipBytes.byteOffset + zipBytes.byteLength,
	);
	return createPbixFileFromBuffer(buffer as ArrayBuffer, fileName);
}
