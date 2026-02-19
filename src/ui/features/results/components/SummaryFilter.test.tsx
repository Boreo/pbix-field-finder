import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SummaryFilter } from "./SummaryFilter";

function ControlledSummaryFilter({ onChangeSpy }: { onChangeSpy: (value: string) => void }) {
	const [value, setValue] = useState("");
	return (
		<SummaryFilter
			globalFilter={value}
			onGlobalFilterChange={(next) => {
				setValue(next);
				onChangeSpy(next);
			}}
		/>
	);
}

describe("SummaryFilter", () => {
	it("updates filter text when typing", async () => {
		const user = userEvent.setup();
		const onGlobalFilterChange = vi.fn();

		render(<ControlledSummaryFilter onChangeSpy={onGlobalFilterChange} />);

		await user.type(screen.getByRole("searchbox", { name: "Filter summary table" }), "orders");
		expect(onGlobalFilterChange).toHaveBeenCalled();
		expect(onGlobalFilterChange).toHaveBeenLastCalledWith("orders");
	});

	it("shows clear button only when filter is active and clears to empty", async () => {
		const user = userEvent.setup();
		const onGlobalFilterChange = vi.fn();
		const { rerender } = render(
			<SummaryFilter globalFilter="" onGlobalFilterChange={onGlobalFilterChange} />,
		);

		expect(screen.queryByRole("button", { name: "Clear summary filter" })).toBeNull();

		rerender(<SummaryFilter globalFilter="orders" onGlobalFilterChange={onGlobalFilterChange} />);
		await user.click(screen.getByRole("button", { name: "Clear summary filter" }));
		expect(onGlobalFilterChange).toHaveBeenCalledWith("");
	});
});
