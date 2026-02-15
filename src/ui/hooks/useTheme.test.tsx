// src/ui/hooks/useTheme.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { THEME_STORAGE_KEY } from "../features/preferences/persistenceKeys";
import { useTheme } from "./useTheme";

function HookHarness() {
	const { mode, toggleMode } = useTheme();

	return (
		<div>
			<span data-testid="mode">{mode}</span>
			<button type="button" onClick={toggleMode}>
				toggle
			</button>
		</div>
	);
}

describe("useTheme", () => {
	beforeEach(() => {
		window.localStorage.clear();
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: query === "(prefers-color-scheme: dark)",
				media: query,
				onchange: null,

				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});
	});

	it("reads initial mode from localStorage", () => {
		window.localStorage.setItem(THEME_STORAGE_KEY, "latte");
		render(<HookHarness />);
		expect(screen.getByTestId("mode")).toHaveTextContent("latte");
	});

	it("defaults to system preference when localStorage is empty", () => {
		render(<HookHarness />);
		expect(screen.getByTestId("mode")).toHaveTextContent("mocha");
	});

	it("toggles and persists mode", async () => {
		const user = userEvent.setup();
		render(<HookHarness />);
		await user.click(screen.getByRole("button", { name: "toggle" }));
		expect(screen.getByTestId("mode")).toHaveTextContent("latte");
		expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("latte");
	});
});
