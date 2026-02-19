import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyFilterRow } from "./EmptyFilterRow";

describe("EmptyFilterRow", () => {
	it("renders no-match filter state with clear action", async () => {
		const user = userEvent.setup();
		const onClearFilter = vi.fn();

		render(
			<table>
				<tbody>
					<EmptyFilterRow
						colSpan={4}
						borderClass="border-test"
						paddingClass="px-1"
						hasFilterNoMatches
						filterMessage={'No rows match "abc".'}
						onClearFilter={onClearFilter}
						fallbackMessage="Fallback"
					/>
				</tbody>
			</table>,
		);

		expect(screen.getByText('No rows match "abc".')).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Clear filter" }));
		expect(onClearFilter).toHaveBeenCalledTimes(1);
	});

	it("renders fallback state without clear action when no filter is active", () => {
		render(
			<table>
				<tbody>
					<EmptyFilterRow
						colSpan={2}
						borderClass="border-test"
						paddingClass="px-1"
						hasFilterNoMatches={false}
						filterMessage="Unused"
						onClearFilter={vi.fn()}
						fallbackMessage="No rows available."
					/>
				</tbody>
			</table>,
		);

		expect(screen.getByText("No rows available.")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Clear filter" })).toBeNull();
	});
});
