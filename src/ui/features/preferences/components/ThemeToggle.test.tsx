import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
	it("renders light-mode state and toggles on click", async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();

		render(<ThemeToggle mode="latte" onToggle={onToggle} />);

		const toggle = screen.getByRole("button", { name: "Switch to dark mode" });
		expect(toggle).toHaveAttribute("aria-pressed", "false");

		await user.click(toggle);
		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	it("renders dark-mode state label", () => {
		render(<ThemeToggle mode="mocha" onToggle={vi.fn()} />);
		const toggle = screen.getByRole("button", { name: "Switch to light mode" });
		expect(toggle).toHaveAttribute("aria-pressed", "true");
	});
});
