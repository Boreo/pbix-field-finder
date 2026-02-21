import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./Panel";

describe("Panel", () => {
	it("renders as div by default with base classes", () => {
		render(<Panel>Body</Panel>);
		const panel = screen.getByText("Body");
		expect(panel.tagName).toBe("DIV");
		expect(panel.className).toContain("rounded-xl");
	});

	it("supports section tag and class name merge", () => {
		render(
			<Panel as="section" className="panel-custom">
				Section body
			</Panel>,
		);
		const panel = screen.getByText("Section body");
		expect(panel.tagName).toBe("SECTION");
		expect(panel.className).toContain("panel-custom");
	});
});
