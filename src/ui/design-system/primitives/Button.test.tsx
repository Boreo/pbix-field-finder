import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	it("uses secondary variant by default and merges custom classes", () => {
		render(
			<Button className="custom-class">
				Action
			</Button>,
		);

		const button = screen.getByRole("button", { name: "Action" });
		expect(button.className).toContain("bg-(--app-surface-0)");
		expect(button.className).toContain("custom-class");
	});

	it("applies selected variant classes", () => {
		render(
			<>
				<Button variant="brand">Brand</Button>
				<Button variant="cta">CTA</Button>
			</>,
		);
		expect(screen.getByRole("button", { name: "Brand" }).className).toContain("bg-(--app-accent-blue)");
		expect(screen.getByRole("button", { name: "CTA" }).className).toContain("bg-(--app-cta-orange)");
	});

	it("forwards refs to the underlying button element", () => {
		const ref = createRef<HTMLButtonElement>();
		render(<Button ref={ref}>Ref</Button>);
		expect(ref.current).toBeInstanceOf(HTMLButtonElement);
		expect(ref.current?.textContent).toBe("Ref");
	});
});
