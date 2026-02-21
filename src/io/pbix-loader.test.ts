import { afterEach, describe, expect, it, vi } from "vitest";
import { isPbixError } from "@/core/errors";
import {
	createInvalidPbixFile,
	createMockPbixFile,
	createMockZipBuffer,
	createPbixFileFromBuffer,
} from "../test/fixtures/mockPbixFile";
import { loadPbixLayout } from "./pbix-loader";

async function expectPbixErrorCode(promise: Promise<unknown>, expectedCode: string) {
	try {
		await promise;
		throw new Error(`Expected PbixError with code ${expectedCode}`);
	} catch (error) {
		expect(isPbixError(error)).toBe(true);
		if (isPbixError(error)) {
			expect(error.code).toBe(expectedCode);
		}
	}
}

describe("loadPbixLayout", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("loads layout from Report/Layout (old format)", async () => {
		const layout = { id: 1, sections: [{ name: "Overview" }] };
		const file = await createMockPbixFile(JSON.stringify(layout), {
			layoutPath: "Report/Layout",
		});

		const result = await loadPbixLayout(file);

		expect(result).toEqual(layout);
	});

	it("loads layout from Report/Layout.json (new format)", async () => {
		const layout = { id: 2, sections: [{ name: "Finance" }] };
		const file = await createMockPbixFile(JSON.stringify(layout), {
			layoutPath: "Report/Layout.json",
		});

		const result = await loadPbixLayout(file);

		expect(result).toEqual(layout);
	});

	it("prefers Report/Layout when both layout paths are present", async () => {
		const oldLayout = { id: 10, sections: [{ name: "Old" }] };
		const newLayout = { id: 20, sections: [{ name: "New" }] };
		const buffer = await createMockZipBuffer({
			"Report/Layout": JSON.stringify(oldLayout),
			"Report/Layout.json": JSON.stringify(newLayout),
		});
		const file = createPbixFileFromBuffer(buffer, "both-layouts.pbix");

		const result = await loadPbixLayout(file);
		expect(result).toEqual(oldLayout);
	});

	it("decodes utf-16le layout content", async () => {
		const layout = { title: "Cafe rapport", sections: [{ displayName: "Ventes ete" }] };
		const file = await createMockPbixFile(JSON.stringify(layout));

		const result = await loadPbixLayout(file);

		expect(result).toEqual(layout);
	});

	it("throws PBIX_NOT_ZIP for invalid zip files", async () => {
		const file = createInvalidPbixFile("not-a-zip");
		await expectPbixErrorCode(loadPbixLayout(file), "PBIX_NOT_ZIP");
	});

	it("throws LAYOUT_NOT_FOUND when no layout entry exists", async () => {
		const buffer = await createMockZipBuffer({
			"Metadata/info.txt": "metadata",
		});
		const file = createPbixFileFromBuffer(buffer, "missing-layout.pbix");

		await expectPbixErrorCode(loadPbixLayout(file), "LAYOUT_NOT_FOUND");
	});

	it("throws LAYOUT_DECODE_FAILED when layout decode fails", async () => {
		const file = await createMockPbixFile(JSON.stringify({ id: 1 }));
		vi.spyOn(TextDecoder.prototype, "decode").mockImplementation(() => {
			throw new Error("decode failed");
		});

		await expectPbixErrorCode(loadPbixLayout(file), "LAYOUT_DECODE_FAILED");
	});

	it("throws LAYOUT_PARSE_FAILED for malformed JSON content", async () => {
		const file = await createMockPbixFile("{not-json");
		await expectPbixErrorCode(loadPbixLayout(file), "LAYOUT_PARSE_FAILED");
	});
});

