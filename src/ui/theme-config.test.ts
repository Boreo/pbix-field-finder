import { describe, expect, it } from "vitest";
import { APP_ACCENT } from "./theme-config";

describe("theme-config", () => {
	it("exports the configured app accent", () => {
		expect(APP_ACCENT).toBe("mauve");
	});
});
