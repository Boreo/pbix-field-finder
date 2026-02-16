import { describe, expect, it } from "vitest";
import { isObjectRecord, parseJsonString } from "./json";

describe("json utils", () => {
	it("parses valid JSON payloads", () => {
		const result = parseJsonString<{ value: number }>('{"value":42}');
		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("Expected parse success");
		}
		expect(result.value).toEqual({ value: 42 });
	});

	it("returns an error result for invalid JSON", () => {
		const result = parseJsonString<unknown>("{invalid");
		expect(result.ok).toBe(false);
		if (result.ok) {
			throw new Error("Expected parse failure");
		}
		expect(result.error).toBeInstanceOf(Error);
	});

	it("checks plain object records", () => {
		expect(isObjectRecord({})).toBe(true);
		expect(isObjectRecord(null)).toBe(false);
		expect(isObjectRecord("text")).toBe(false);
		expect(isObjectRecord(42)).toBe(false);
	});
});
