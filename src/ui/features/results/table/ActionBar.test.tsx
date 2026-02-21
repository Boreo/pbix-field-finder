import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionBar } from "./ActionBar";

describe("ActionBar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("runs raw csv export from the primary button", async () => {
		const user = userEvent.setup();
		const onExportRawCsv = vi.fn();

		render(
			<ActionBar
				disabled={false}
				onExportSummaryJson={vi.fn()}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Export raw CSV" }));
		expect(onExportRawCsv).toHaveBeenCalledTimes(1);
	});

	it("runs dropdown export actions", async () => {
		const user = userEvent.setup();
		const onExportSummaryJson = vi.fn();
		const onExportRawCsv = vi.fn();
		const onExportDetailsJson = vi.fn();

		render(
			<ActionBar
				disabled={false}
				onExportSummaryJson={onExportSummaryJson}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={onExportDetailsJson}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Open export menu" }));
		expect(screen.queryByRole("menuitem", { name: "Copy Raw CSV" })).toBeNull();
		await user.click(screen.getByRole("menuitem", { name: "Export Summary JSON" }));
		expect(onExportSummaryJson).toHaveBeenCalledTimes(1);

		await user.click(screen.getByRole("button", { name: "Open export menu" }));
		await user.click(screen.getByRole("menuitem", { name: "Export Raw CSV" }));
		expect(onExportRawCsv).toHaveBeenCalledTimes(1);

		await user.click(screen.getByRole("button", { name: "Open export menu" }));
		await user.click(screen.getByRole("menuitem", { name: "Export Details JSON" }));
		expect(onExportDetailsJson).toHaveBeenCalledTimes(1);
	});

	it("disables primary and menu controls when disabled", async () => {
		const user = userEvent.setup();
		const onExportRawCsv = vi.fn();

		render(
			<ActionBar
				disabled
				onExportSummaryJson={vi.fn()}
				onExportRawCsv={onExportRawCsv}
				onExportDetailsJson={vi.fn()}
			/>,
		);

		const exportButton = screen.getByRole("button", { name: "Export raw CSV" });
		const menuButton = screen.getByRole("button", { name: "Open export menu" });

		expect(exportButton).toBeDisabled();
		expect(menuButton).toBeDisabled();

		await user.click(exportButton);
		expect(onExportRawCsv).not.toHaveBeenCalled();
	});
});
