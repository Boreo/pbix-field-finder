import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutSection } from "./AboutSection";

describe("AboutSection", () => {
	it("renders prominent styling when requested", () => {
		render(<AboutSection isProminent mode="mocha" />);
		const section = screen.getByTestId("about-section");
		expect(section.className).toContain("border-(--app-accent)");
		expect(section.className).not.toContain("border-ctp-surface2");
	});

	it("renders subtle styling and uses theme-specific github logo", () => {
		const { rerender } = render(<AboutSection isProminent={false} mode="latte" />);
		const section = screen.getByTestId("about-section");
		expect(section.className).toContain("border-ctp-surface2");

		const viewSourceLink = screen.getByRole("link", { name: /View source/i });
		const latteLogo = viewSourceLink.querySelector("img");
		const latteSrc = latteLogo?.getAttribute("src");
		expect(latteSrc).toBeTruthy();

		rerender(<AboutSection isProminent={false} mode="mocha" />);
		const mochaLogo = screen.getByRole("link", { name: /View source/i }).querySelector("img");
		const mochaSrc = mochaLogo?.getAttribute("src");
		expect(mochaSrc).toBeTruthy();
		expect(mochaSrc).not.toBe(latteSrc);
	});
});
