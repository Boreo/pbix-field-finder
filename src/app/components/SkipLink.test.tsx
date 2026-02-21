import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkipLink } from "./SkipLink";

describe("SkipLink", () => {
	it("prevents default navigation and focuses main content", () => {
		document.body.innerHTML = "";
		const main = document.createElement("main");
		main.id = "main-content";
		main.tabIndex = -1;
		Object.defineProperty(main, "scrollIntoView", {
			configurable: true,
			value: vi.fn(),
		});
		const focusSpy = vi.spyOn(main, "focus");
		const scrollSpy = vi.spyOn(main, "scrollIntoView");
		document.body.appendChild(main);

		render(<SkipLink />);
		const link = screen.getByRole("link", { name: "Skip to main content" });

		const event = new MouseEvent("click", { bubbles: true, cancelable: true });
		const wasCancelled = !link.dispatchEvent(event);

		expect(wasCancelled).toBe(true);
		expect(focusSpy).toHaveBeenCalledTimes(1);
		expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth" });
	});

	it("no-ops safely when main content target is missing", () => {
		document.body.innerHTML = "";
		render(<SkipLink />);
		const link = screen.getByRole("link", { name: "Skip to main content" });
		expect(() => fireEvent.click(link)).not.toThrow();
	});
});
