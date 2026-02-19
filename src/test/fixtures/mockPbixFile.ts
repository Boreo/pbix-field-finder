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
	return zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength);
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
