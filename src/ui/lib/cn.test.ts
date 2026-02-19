import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
	it("joins truthy class names with spaces", () => {
		expect(cn("a", "b", "c")).toBe("a b c");
	});

	it("drops falsy inputs", () => {
		expect(cn("base", false, null, undefined, "active")).toBe("base active");
	});
});
