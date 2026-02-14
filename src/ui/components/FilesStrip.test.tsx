// src/ui/components/FilesStrip.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilesStrip } from "./FilesStrip";

const singleFile = [{ id: "file-1", file: new File(["x"], "report.pbix"), visible: true, errorMessage: null }];
const multiFiles = [
	{ id: "file-1", file: new File(["x"], "report.pbix"), visible: true, errorMessage: null },
	{ id: "file-2", file: new File(["x"], "sales.pbix"), visible: true, errorMessage: null },
];

describe("FilesStrip", () => {
	it("accepts dropped files and reports unsupported files", () => {
		const onAddFiles = vi.fn();
		const onValidationError = vi.fn();
		const { container } = render(
			<FilesStrip
				files={singleFile}
				onAddFiles={onAddFiles}
				onRemoveFile={vi.fn()}
				onClearFiles={vi.fn()}
				onToggleFileVisibility={vi.fn()}
				onValidationError={onValidationError}
			/>,
		);

		const strip = container.firstElementChild as HTMLDivElement;
		const validFile = new File(["x"], "new.pbix", { type: "application/octet-stream" });
		const invalidFile = new File(["x"], "notes.txt", { type: "text/plain" });

		fireEvent.dragEnter(strip, { dataTransfer: { files: [validFile, invalidFile] } });
		expect(strip.className).toContain("border-(--app-cta)");

		fireEvent.drop(strip, { dataTransfer: { files: [validFile, invalidFile] } });
		expect(onAddFiles).toHaveBeenCalledWith([validFile]);
		expect(onValidationError).toHaveBeenCalledWith("Unsupported files: notes.txt.");
	});

	it("does not process drop when disabled", () => {
		const onAddFiles = vi.fn();
		const { container } = render(
			<FilesStrip
				files={singleFile}
				onAddFiles={onAddFiles}
				onRemoveFile={vi.fn()}
				onClearFiles={vi.fn()}
				onToggleFileVisibility={vi.fn()}
				disabled
			/>,
		);

		const strip = container.firstElementChild as HTMLDivElement;
		const validFile = new File(["x"], "new.pbix", { type: "application/octet-stream" });
		fireEvent.drop(strip, { dataTransfer: { files: [validFile] } });

		expect(onAddFiles).not.toHaveBeenCalled();
	});

	it("shows single-file mode with Add files button and no visibility toggle", () => {
		render(
			<FilesStrip
				files={singleFile}
				onAddFiles={vi.fn()}
				onRemoveFile={vi.fn()}
				onClearFiles={vi.fn()}
				onToggleFileVisibility={vi.fn()}
			/>,
		);

		const addButton = screen.getByRole("button", { name: "Add files" });
		expect(addButton.className).toContain("px-3");
		expect(addButton.className).toContain("py-2");
		expect(addButton.className).toContain("text-sm");
		expect(addButton).toHaveAttribute("title", "Add more PBIX files to the current list");

		expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
		const header = screen.getByRole("heading", { name: "Files · 1 file" });
		expect(header.className).toContain("text-xs");
		expect(header.className).toContain("leading-tight");

		const removeButton = screen.getByRole("button", { name: "Remove report.pbix" });
		expect(removeButton).toHaveAttribute("title", "Remove report.pbix from the current file list");

		expect(screen.queryByRole("button", { name: /Hide report\.pbix/ })).toBeNull();
		expect(screen.queryByRole("button", { name: /Show report\.pbix/ })).toBeNull();
	});

	it("shows multi-file mode with Add files, Clear all, and file header", () => {
		render(
			<FilesStrip
				files={multiFiles}
				onAddFiles={vi.fn()}
				onRemoveFile={vi.fn()}
				onClearFiles={vi.fn()}
				onToggleFileVisibility={vi.fn()}
			/>,
		);

		const addButton = screen.getByRole("button", { name: "Add files" });
		expect(addButton.className).toContain("px-3");
		expect(addButton.className).toContain("py-2");
		expect(addButton.className).toContain("text-sm");
		expect(addButton).toHaveAttribute("title", "Add more PBIX files to the current list");

		const clearButton = screen.getByRole("button", { name: "Clear all" });
		expect(clearButton.className).toContain("px-3");
		expect(clearButton).toHaveAttribute("title", "Remove all files from the current list");
		const header = screen.getByRole("heading", { name: "Files · 2 files" });
		expect(header.className).toContain("text-xs");
		expect(header.className).toContain("leading-tight");

		const hideButton = screen.getByRole("button", { name: "Hide report.pbix" });
		const fileName = screen.getByText("report.pbix");
		const chip = fileName.parentElement;
		expect(chip).not.toBeNull();
		expect(chip?.className ?? "").toContain("pr-1");
		expect(chip?.className ?? "").toContain(
			"border-[color-mix(in_srgb,var(--color-ctp-green)_52%,var(--app-border))]",
		);
		expect(chip?.firstElementChild).toBe(hideButton);
		expect(chip?.children[1]).toBe(fileName);
	});

	it("shows hidden chip state with visibility count", () => {
		const filesWithHidden = [
			{ id: "file-1", file: new File(["x"], "report.pbix"), visible: true, errorMessage: null },
			{ id: "file-2", file: new File(["x"], "sales.pbix"), visible: false, errorMessage: null },
		];

		render(
			<FilesStrip
				files={filesWithHidden}
				onAddFiles={vi.fn()}
				onRemoveFile={vi.fn()}
				onClearFiles={vi.fn()}
				onToggleFileVisibility={vi.fn()}
			/>,
		);

		expect(screen.getByText("Files · 1 visible \u00b7 2 total")).toBeTruthy();

		const showButton = screen.getByRole("button", { name: /Show sales\.pbix/ });
		expect(showButton).toHaveAttribute("aria-pressed", "true");
	});

	it("renders failed files as crossed-out error chips without visibility toggle", () => {
		const filesWithError = [
			{ id: "file-1", file: new File(["x"], "good.pbix"), visible: true, errorMessage: null },
			{
				id: "file-2",
				file: new File(["x"], "bad.pbix"),
				visible: true,
				errorMessage: "The PBIX file does not contain a report layout.",
			},
		];

		render(
			<FilesStrip
				files={filesWithError}
				onAddFiles={vi.fn()}
				onRemoveFile={vi.fn()}
				onClearFiles={vi.fn()}
				onToggleFileVisibility={vi.fn()}
			/>,
		);

		const failedName = screen.getByText("bad.pbix");
		expect(failedName.className).toContain("line-through");
		const failedChip = failedName.parentElement;
		expect(failedChip?.className ?? "").toContain("border-ctp-red");
		expect(failedChip?.className ?? "").toContain("text-(--app-fg-danger)");
		expect(screen.queryByRole("button", { name: "Hide bad.pbix" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Show bad.pbix" })).toBeNull();
		expect(screen.getByRole("button", { name: "Remove bad.pbix" })).toBeInTheDocument();
	});
});
