import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
	it("uses default variant and size", () => {
		render(<IconButton aria-label="icon" />);
		const button = screen.getByRole("button", { name: "icon" });
		expect(button.className).toContain("text-(--app-fg-secondary)");
		expect(button.className).toContain("p-1.5");
	});

	it("applies selected variant and size overrides", () => {
		render(<IconButton aria-label="danger" variant="danger" size="sm" />);
		const button = screen.getByRole("button", { name: "danger" });
		expect(button.className).toContain("hover:text-(--app-fg-danger)");
		expect(button.className).toContain("h-6");
		expect(button.className).toContain("w-6");
	});

	it("forwards refs", () => {
		const ref = createRef<HTMLButtonElement>();
		render(<IconButton ref={ref} aria-label="ref-icon" />);
		expect(ref.current).toBeInstanceOf(HTMLButtonElement);
	});
});
