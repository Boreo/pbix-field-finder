// src/ui/App.test.tsx
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import {
	AUTO_WIDE_SUPPRESS_STORAGE_KEY,
	LAYOUT_WIDTH_MODE_STORAGE_KEY,
	TABLE_DENSITY_STORAGE_KEY,
} from "@/ui/features/preferences";

const mocks = vi.hoisted(() => ({
	loadPbixLayout: vi.fn(),
	analyseReport: vi.fn(),
	copyRawCsvToClipboard: vi.fn(),
	exportSummaryJson: vi.fn(),
	exportRawCsv: vi.fn(),
	exportDetailsJson: vi.fn(),
	isPbixError: vi.fn((error: unknown) => Boolean((error as { isPbixError?: boolean })?.isPbixError)),
}));

vi.mock("../io/pbix-loader", () => ({ loadPbixLayout: mocks.loadPbixLayout }));
vi.mock("../core/report-analyser", () => ({ analyseReport: mocks.analyseReport }));
vi.mock("../core/errors", () => ({ isPbixError: mocks.isPbixError }));
vi.mock("../io/data-export", () => ({
	copyRawCsvToClipboard: mocks.copyRawCsvToClipboard,
	exportSummaryJson: mocks.exportSummaryJson,
	exportRawCsv: mocks.exportRawCsv,
	exportDetailsJson: mocks.exportDetailsJson,
}));

function mockMatchMedia({ prefersDark = true, widthCapable = true }: { prefersDark?: boolean; widthCapable?: boolean } = {}) {
	const listeners = new Map<string, Set<(event: MediaQueryListEvent) => void>>();
	const queryMatches = new Map<string, boolean>();
	queryMatches.set("(prefers-color-scheme: dark)", prefersDark);
	queryMatches.set("(min-width: calc(275mm + 3rem))", widthCapable);

	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			get matches() {
				return queryMatches.get(query) ?? false;
			},
			media: query,
			onchange: null,

			addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
				if (!listeners.has(query)) {
					listeners.set(query, new Set());
				}
				listeners.get(query)?.add(listener);
			},
			removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
				listeners.get(query)?.delete(listener);
			},
			dispatchEvent: vi.fn(),
		})),
	});

	return {
		setQueryMatch: (query: string, matches: boolean) => {
			queryMatches.set(query, matches);
			const event = { matches, media: query } as MediaQueryListEvent;
			listeners.get(query)?.forEach((listener) => listener(event));
		},
	};
}

describe("AppShell", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
		window.sessionStorage.clear();
		mockMatchMedia();
		mocks.analyseReport.mockReturnValue({
			normalised: [
				{
					report: "sales",
					page: "Page1",
					pageIndex: 0,
					visualType: "table",
					visualId: "v1",
					visualTitle: "",
					role: "values",
					table: "Orders",
					field: "Amount",
					fieldKind: "column",
					expression: null,
					isHiddenVisual: false,
					isHiddenFilter: false,
				},
			],
		});
	});

	it("processes files and shows summary table directly", async () => {
		const user = userEvent.setup();
		mocks.loadPbixLayout.mockResolvedValue({});

		render(<AppShell />);
		expect(screen.getByRole("heading", { name: "Power BI Field Usage Finder" })).toBeInTheDocument();
		expect(screen.getByText("Fast, in-browser alternative for where fields are used in a PBIX report.")).toBeInTheDocument();
		expect(document.getElementById("main-content")).toBeNull();

		await user.upload(screen.getByLabelText("Upload PBIX files"), new File(["x"], "sales.pbix"));

		await screen.findByText("Processed 1 files: 1 succeeded, 0 failed.");
		const mainContent = document.getElementById("main-content");
		expect(mainContent).not.toBeNull();
		expect(mainContent).toContainElement(screen.getByText("Summary table"));
		expect(screen.queryByLabelText("Upload PBIX files")).not.toBeInTheDocument();
		expect(screen.getByText("Files · 1 file")).toBeInTheDocument();
		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
	});

	it("shows about section prominently with no files, and keeps it after upload", async () => {
		const user = userEvent.setup();
		mocks.loadPbixLayout.mockResolvedValue({});

		render(<AppShell />);

		const aboutSection = screen.getByTestId("about-section");
		expect(aboutSection.className).toContain(
			"border-[color-mix(in_srgb,var(--app-accent-secondary)_32%,var(--app-stroke)_68%)]",
		);
		expect(aboutSection).toHaveTextContent("Runs fully in your browser.");
		expect(aboutSection).toHaveTextContent(
			"All processing happens on your device. Nothing is uploaded or sent to a server.",
		);
		expect(aboutSection).toHaveTextContent(
			"Need deeper modelling context or “what’s not used”? Use the Field Finder template.",
		);

		expect(screen.getByRole("link", { name: /View source/i })).toHaveAttribute(
			"href",
			"https://github.com/boreo/pbix-field-finder",
		);
		expect(screen.getByRole("link", { name: /Field Finder template/i })).toHaveAttribute(
			"href",
			"https://github.com/stephbruno/Power-BI-Field-Finder",
		);
		expect(screen.getByRole("link", { name: /Issues & feedback/i })).toHaveAttribute(
			"href",
			"https://github.com/Boreo/pbix-field-finder/issues",
		);
		expect(screen.queryByText(/Catppuccin/i)).not.toBeInTheDocument();

		await user.upload(screen.getByLabelText("Upload PBIX files"), new File(["x"], "sales.pbix"));
		await screen.findByText("Processed 1 files: 1 succeeded, 0 failed.");

		const aboutSectionAfterUpload = screen.getByTestId("about-section");
		expect(aboutSectionAfterUpload.className).toContain("border-(--app-stroke)");
		expect(aboutSectionAfterUpload.className).not.toContain("var(--app-accent-secondary)_32%");
	});

	it("toggles fill/narrow layout with icon-only button", async () => {
		const user = userEvent.setup();
		render(<AppShell />);

		const layoutToggle = screen.getByRole("button", { name: "Switch to narrow layout" });
		expect(layoutToggle).not.toHaveTextContent("Layout");
		expect(layoutToggle).toHaveAttribute("title", "Switch to narrow layout");
		expect(layoutToggle.className).not.toContain("border");
		expect(layoutToggle.className).toContain("cursor-pointer");

		await user.click(layoutToggle);

		expect(screen.getByRole("button", { name: "Switch to full-width layout" })).toHaveAttribute(
			"title",
			"Switch to full-width layout",
		);
		expect(window.localStorage.getItem(LAYOUT_WIDTH_MODE_STORAGE_KEY)).toBe("narrow");
	});

	it("hides fill/narrow layout toggle when viewport is not wide enough", () => {
		mockMatchMedia({ widthCapable: false });
		render(<AppShell />);
		expect(screen.queryByRole("button", { name: /Switch to (narrow|full-width) layout/ })).not.toBeInTheDocument();
	});

	it("shows warning-ready status when some files fail to process", async () => {
		const user = userEvent.setup();
		mocks.loadPbixLayout
			.mockResolvedValueOnce({})
			.mockRejectedValueOnce({ isPbixError: true, code: "LAYOUT_NOT_FOUND" });

		render(<AppShell />);
		await user.upload(screen.getByLabelText("Upload PBIX files"), [
			new File(["x"], "ok.pbix"),
			new File(["x"], "dead.pbix"),
		]);

		await waitFor(() => {
			const status = screen.getByRole("status");
			expect(status).toHaveTextContent(/Ready .* across .* - with 1 error/);
			expect(status.className).toContain("text-(--app-fg-warning)");
		});
	});

	it("auto-switches narrow to wide once and suppresses future auto-switches after manual narrow", async () => {
		window.localStorage.setItem(LAYOUT_WIDTH_MODE_STORAGE_KEY, "narrow");
		const media = mockMatchMedia({ widthCapable: false });

		const user = userEvent.setup();
		render(<AppShell />);

		expect(screen.queryByRole("button", { name: /Switch to (narrow|full-width) layout/ })).not.toBeInTheDocument();

		act(() => {
			media.setQueryMatch("(min-width: calc(275mm + 3rem))", true);
		});

		await waitFor(() =>
			expect(screen.getByRole("button", { name: "Switch to narrow layout" })).toBeInTheDocument(),
		);
		expect(window.localStorage.getItem(LAYOUT_WIDTH_MODE_STORAGE_KEY)).toBe("fill");

		await user.click(screen.getByRole("button", { name: "Switch to narrow layout" }));
		await waitFor(() => expect(window.localStorage.getItem(LAYOUT_WIDTH_MODE_STORAGE_KEY)).toBe("narrow"));
		expect(window.localStorage.getItem(AUTO_WIDE_SUPPRESS_STORAGE_KEY)).toBe("true");

		act(() => {
			media.setQueryMatch("(min-width: calc(275mm + 3rem))", false);
			media.setQueryMatch("(min-width: calc(275mm + 3rem))", true);
		});

		await waitFor(() =>
			expect(screen.getByRole("button", { name: "Switch to full-width layout" })).toBeInTheDocument(),
		);
		expect(window.localStorage.getItem(LAYOUT_WIDTH_MODE_STORAGE_KEY)).toBe("narrow");
	});

	it("uses descriptive action tooltip text on the theme switch", async () => {
		const user = userEvent.setup();
		render(<AppShell />);

		const darkModeSwitch = screen.getByRole("button", { name: "Switch to light mode" });
		expect(darkModeSwitch).toHaveAttribute("title", "Switch to light mode");
		expect(darkModeSwitch.className).toContain("cursor-pointer");

		await user.click(darkModeSwitch);

		expect(screen.getByRole("button", { name: "Switch to dark mode" })).toHaveAttribute(
			"title",
			"Switch to dark mode",
		);
	});

	it("updates row density from summary table controls and persists selection", async () => {
		const user = userEvent.setup();
		mocks.loadPbixLayout.mockResolvedValue({});

		render(<AppShell />);
		await user.upload(screen.getByLabelText("Upload PBIX files"), new File(["x"], "sales.pbix"));
		await screen.findByText("Processed 1 files: 1 succeeded, 0 failed.");

		await user.click(screen.getByRole("button", { name: "Set row spacing to compact" }));
		expect(window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY)).toBe("compact");
	});

	it("density control uses dedicated lane icon button styling and pressed states", async () => {
		const user = userEvent.setup();
		mocks.loadPbixLayout.mockResolvedValue({});

		render(<AppShell />);
		await user.upload(screen.getByLabelText("Upload PBIX files"), new File(["x"], "sales.pbix"));
		await screen.findByText("Processed 1 files: 1 succeeded, 0 failed.");

		const densityGroup = screen.getByRole("group", { name: "Row spacing controls" });
		const comfortableButton = screen.getByRole("button", { name: "Set row spacing to comfortable" });
		const compactButton = screen.getByRole("button", { name: "Set row spacing to compact" });
		const exportButton = screen.getByRole("button", { name: "Export raw CSV" });

		expect(densityGroup.className).toContain("inline-flex");
		expect(densityGroup.className).toContain("z-0");
		expect(densityGroup.className).toContain("bg-(--app-surface-1)");
		expect(densityGroup.className).toContain("opacity-85");
		expect(densityGroup.className).not.toContain("shadow");
		expect(densityGroup.className).not.toContain("absolute");
		expect(comfortableButton.className).toContain("cursor-pointer");
		expect(compactButton.className).toContain("cursor-pointer");
		expect(comfortableButton.className).toContain("h-6");
		expect(comfortableButton.className).toContain("w-6");
		expect(comfortableButton.className).toContain("bg-(--app-fill-hover)");
		expect(compactButton.className).toContain("h-6");
		expect(compactButton.className).toContain("w-6");
		expect(comfortableButton).toHaveAttribute("aria-pressed", "true");
		expect(compactButton).toHaveAttribute("aria-pressed", "false");
		expect(screen.queryByRole("radiogroup", { name: "Row density" })).not.toBeInTheDocument();
		expect(exportButton).toBeVisible();

		await user.click(compactButton);
		expect(compactButton).toHaveAttribute("aria-pressed", "true");
	});

	it("always appends when adding files to an existing set", async () => {
		const user = userEvent.setup();
		mocks.loadPbixLayout.mockResolvedValue({});

		render(<AppShell />);

		await user.upload(screen.getByLabelText("Upload PBIX files"), new File(["x"], "one.pbix"));
		await screen.findByText("Processed 1 files: 1 succeeded, 0 failed.");

		await user.upload(screen.getByLabelText("Add PBIX files"), new File(["y"], "two.pbix"));

		await waitFor(() => expect(mocks.loadPbixLayout).toHaveBeenCalledTimes(3));
		await screen.findByText("Processed 2 files: 2 succeeded, 0 failed.");
	});

	it("exports raw CSV by default and offers copy/export options in the menu", async () => {
		const user = userEvent.setup();
		mocks.loadPbixLayout.mockResolvedValue({});

		render(<AppShell />);
		await user.upload(screen.getByLabelText("Upload PBIX files"), new File(["x"], "sales.pbix"));
		await screen.findByText("Processed 1 files: 1 succeeded, 0 failed.");

		await user.click(screen.getByRole("button", { name: "Export raw CSV" }));
		expect(mocks.exportRawCsv).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("button", { name: "Export raw CSV" })).toHaveAttribute(
			"title",
			"Export raw CSV",
		);
		await user.click(screen.getByRole("button", { name: "Copy raw CSV" }));
		expect(mocks.copyRawCsvToClipboard).toHaveBeenCalledTimes(1);

		await user.click(screen.getByRole("button", { name: "Open export menu" }));
		expect(screen.getByRole("button", { name: "Open export menu" })).toHaveAttribute("title", "Open export menu");
		expect(screen.getByRole("button", { name: "Open export menu" })).toHaveAttribute("aria-haspopup", "menu");

		const exportMenuItems = screen.getAllByRole("menuitem");
		expect(exportMenuItems).toHaveLength(3);
		expect(exportMenuItems[0]).toHaveTextContent("Export Raw CSV");
		expect(exportMenuItems[0]).toHaveAttribute("title", "Download the normalised field usage dataset as CSV");
		expect(exportMenuItems[1]).toHaveTextContent("Export Summary JSON");
		expect(exportMenuItems[1]).toHaveAttribute("title", "Download the grouped summary dataset as JSON");
		expect(exportMenuItems[2]).toHaveTextContent("Export Details JSON");
		expect(exportMenuItems[2]).toHaveAttribute("title", "Download per-page field usage details as JSON");

		await user.click(screen.getByRole("menuitem", { name: "Export Summary JSON" }));
		expect(mocks.exportSummaryJson).toHaveBeenCalledTimes(1);

		const exportButton = screen.getByRole("button", { name: "Export raw CSV" });
		const exportMenuButton = screen.getByRole("button", { name: "Open export menu" });
		expect(exportButton.className).toContain("h-9");
		expect(exportButton.className).toContain("cursor-pointer");
		expect(exportMenuButton.className).toContain("h-9");
		expect(exportMenuButton.className).toContain("w-7");
		expect(exportMenuButton.className).toContain("cursor-pointer");
		expect(exportButton.className).toContain("disabled:cursor-not-allowed");
		expect(exportMenuButton.className).toContain("disabled:cursor-not-allowed");

		await user.click(screen.getByRole("button", { name: "Open export menu" }));
		await user.click(screen.getByRole("menuitem", { name: "Export Raw CSV" }));
		expect(mocks.exportRawCsv).toHaveBeenCalledTimes(2);

		await user.click(screen.getByRole("button", { name: "Open export menu" }));
		await user.click(screen.getByRole("menuitem", { name: "Export Details JSON" }));
		expect(mocks.exportDetailsJson).toHaveBeenCalledTimes(1);

		await user.click(screen.getByRole("button", { name: "Open export menu" }));
		expect(screen.queryByRole("menuitem", { name: "Export Summary CSV" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Export Details CSV" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Export Raw JSON" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Export Aggregated CSV" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "Export Aggregated JSON" })).not.toBeInTheDocument();
	});
});

