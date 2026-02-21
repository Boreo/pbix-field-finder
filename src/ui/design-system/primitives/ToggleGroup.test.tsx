import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleGroup } from "./ToggleGroup";

describe("ToggleGroup", () => {
	it("renders group with aria label", () => {
		render(
			<ToggleGroup aria-label="Display mode" value="pages" onChange={vi.fn()}>
				<ToggleGroup.Button
					value="pages"
					selected
					onSelect={vi.fn()}
				>
					Pages
				</ToggleGroup.Button>
			</ToggleGroup>,
		);

		expect(screen.getByRole("group", { name: "Display mode" })).toBeInTheDocument();
	});

	it("renders pressed states and notifies selected value", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();

		render(
			<ToggleGroup aria-label="Tab mode" value="pages" onChange={vi.fn()}>
				<ToggleGroup.Button value="pages" selected onSelect={onSelect}>
					Pages
				</ToggleGroup.Button>
				<ToggleGroup.Button value="visuals" selected={false} onSelect={onSelect}>
					Visuals
				</ToggleGroup.Button>
			</ToggleGroup>,
		);

		expect(screen.getByRole("button", { name: "Pages" })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByRole("button", { name: "Visuals" })).toHaveAttribute("aria-pressed", "false");

		await user.click(screen.getByRole("button", { name: "Visuals" }));
		expect(onSelect).toHaveBeenCalledWith("visuals");
	});
});
