import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
	it("renders children and base classes", () => {
		render(<Chip>Hello</Chip>);
		const chip = screen.getByText("Hello");
		expect(chip.className).toContain("rounded-md");
		expect(chip.className).toContain("bg-ctp-crust");
	});

	it("merges custom class names", () => {
		render(<Chip className="chip-custom">Value</Chip>);
		expect(screen.getByText("Value").className).toContain("chip-custom");
	});
});
