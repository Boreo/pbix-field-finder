import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

const mocks = vi.hoisted(() => ({
	themeToggle: vi.fn(),
}));

vi.mock("./ThemeToggle", () => ({
	ThemeToggle: (props: unknown) => {
		mocks.themeToggle(props);
		const typed = props as { onToggle: () => void };
		return (
			<button type="button" onClick={typed.onToggle}>
				toggle-theme
			</button>
		);
	},
}));

describe("AppHeader", () => {
	it("shows layout toggle with correct labels for both layout modes", async () => {
		const user = userEvent.setup();
		const onToggleLayoutWidth = vi.fn();

		const { rerender } = render(
			<AppHeader
				mode="latte"
				onToggleTheme={vi.fn()}
				layoutWidthMode="narrow"
				onToggleLayoutWidth={onToggleLayoutWidth}
				showLayoutWidthToggle
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Switch to full-width layout" }));
		expect(onToggleLayoutWidth).toHaveBeenCalledTimes(1);

		rerender(
			<AppHeader
				mode="latte"
				onToggleTheme={vi.fn()}
				layoutWidthMode="fill"
				onToggleLayoutWidth={onToggleLayoutWidth}
				showLayoutWidthToggle
			/>,
		);
		expect(screen.getByRole("button", { name: "Switch to narrow layout" })).toBeInTheDocument();
	});

	it("hides layout toggle when disabled by viewport condition", () => {
		render(
			<AppHeader
				mode="latte"
				onToggleTheme={vi.fn()}
				layoutWidthMode="fill"
				onToggleLayoutWidth={vi.fn()}
				showLayoutWidthToggle={false}
			/>,
		);

		expect(screen.queryByRole("button", { name: /Switch to (full-width|narrow) layout/ })).toBeNull();
	});

	it("renders theme toggle and forwards toggle callback", async () => {
		const user = userEvent.setup();
		const onToggleTheme = vi.fn();

		render(
			<AppHeader
				mode="mocha"
				onToggleTheme={onToggleTheme}
				layoutWidthMode="fill"
				onToggleLayoutWidth={vi.fn()}
				showLayoutWidthToggle
			/>,
		);

		expect(mocks.themeToggle).toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "toggle-theme" }));
		expect(onToggleTheme).toHaveBeenCalledTimes(1);
	});
});
