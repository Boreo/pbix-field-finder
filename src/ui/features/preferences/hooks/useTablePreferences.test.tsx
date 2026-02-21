// src/ui/features/preferences/hooks/useTablePreferences.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import {
	LAYOUT_WIDTH_MODE_STORAGE_KEY,
	TABLE_DENSITY_STORAGE_KEY,
} from "../storage/keys";
import { useTablePreferences } from "./useTablePreferences";

function HookHarness() {
	const {
		density,
		setDensity,
		layoutWidthMode,
		setLayoutWidthMode,
	} = useTablePreferences();

	return (
		<div>
			<span data-testid="density">{density}</span>
			<span data-testid="layout">{layoutWidthMode}</span>
			<button type="button" onClick={() => setDensity("compact")}>
				compact
			</button>
			<button type="button" onClick={() => setLayoutWidthMode("narrow")}>
				narrow
			</button>
		</div>
	);
}

describe("useTablePreferences", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("reads preferences from local storage", () => {
		window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, "compact");
		window.localStorage.setItem(LAYOUT_WIDTH_MODE_STORAGE_KEY, "narrow");
		render(<HookHarness />);

		expect(screen.getByTestId("density")).toHaveTextContent("compact");
		expect(screen.getByTestId("layout")).toHaveTextContent("narrow");
	});

	it("writes updates to local storage", async () => {
		const user = userEvent.setup();
		render(<HookHarness />);

		await user.click(screen.getByRole("button", { name: "compact" }));
		await user.click(screen.getByRole("button", { name: "narrow" }));

		expect(window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY)).toBe("compact");
		expect(window.localStorage.getItem(LAYOUT_WIDTH_MODE_STORAGE_KEY)).toBe("narrow");
	});

	it("falls back to defaults when stored values are invalid", () => {
		window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, "invalid-density");
		window.localStorage.setItem(LAYOUT_WIDTH_MODE_STORAGE_KEY, "invalid-layout");

		render(<HookHarness />);

		expect(screen.getByTestId("density")).toHaveTextContent("comfortable");
		expect(screen.getByTestId("layout")).toHaveTextContent("fill");
	});
});
