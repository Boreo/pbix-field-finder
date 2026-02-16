import { describe, expect, it } from "vitest";
import { isPbixError, PbixError } from "./errors";

describe("pbix errors", () => {
	it("creates typed pbix errors with stable metadata", () => {
		const cause = new Error("root");
		const error = new PbixError("LAYOUT_PARSE_FAILED", cause);

		expect(error.name).toBe("PbixError");
		expect(error.code).toBe("LAYOUT_PARSE_FAILED");
		expect(error.message).toBe("PBIX_ERROR:LAYOUT_PARSE_FAILED");
		expect(error.cause).toBe(cause);
	});

	it("detects pbix errors", () => {
		expect(isPbixError(new PbixError("PBIX_NOT_ZIP"))).toBe(true);
		expect(isPbixError(new Error("plain"))).toBe(false);
		expect(isPbixError({ code: "PBIX_NOT_ZIP" })).toBe(false);
	});
});
