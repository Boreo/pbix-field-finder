import { describe, expect, it } from "vitest";
import { APP_ACCENT, APP_SECONDARY_ACCENT } from "./theme";

describe("theme", () => {
	it("exports the configured app accents", () => {
		expect(APP_ACCENT).toBe("blue");
		expect(APP_SECONDARY_ACCENT).toBe("mauve");
	});
});
