// src/ui/components/FileDropzone.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { FileDropzone } from "./FileDropzone";

describe("FileDropzone", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("accepts valid PBIX files and reports unsupported files", async () => {
		const user = userEvent.setup({ applyAccept: false });
		const onFilesAccepted = vi.fn();
		const onValidationError = vi.fn();

		render(<FileDropzone onFilesAccepted={onFilesAccepted} onValidationError={onValidationError} />);

		const input = screen.getByLabelText("Upload PBIX files");
		const validFile = new File(["x"], "report.pbix", { type: "application/octet-stream" });
		const invalidFile = new File(["x"], "notes.txt", { type: "text/plain" });

		await user.upload(input, [validFile, invalidFile]);

		expect(onFilesAccepted).toHaveBeenCalledTimes(1);
		expect(onFilesAccepted).toHaveBeenCalledWith([validFile]);
		expect(onValidationError).toHaveBeenCalledWith("Unsupported files: notes.txt.");
		const selectButton = screen.getByRole("button", { name: "Select Power BI files" });
		expect(selectButton.className).toContain("w-82.5");
		expect(selectButton.className).toContain("h-20");
		expect(selectButton.className).toContain("font-semibold");
		expect(selectButton.className).toContain("text-[24px]");
		expect(selectButton.className).toContain("leading-tight");
		expect(selectButton.querySelector("svg")).toBeNull();
	});

	it("blocks click and keyboard file-dialog interactions when disabled", async () => {
		const user = userEvent.setup();
		const onFilesAccepted = vi.fn();
		const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});

		render(<FileDropzone disabled onFilesAccepted={onFilesAccepted} onValidationError={vi.fn()} />);

		const dropzone = screen.getByRole("button", { name: "PBIX file dropzone" });
		const selectButton = screen.getByRole("button", { name: "Select Power BI files" });

		await user.click(dropzone);
		fireEvent.keyDown(dropzone, { key: "Enter" });
		fireEvent.keyDown(dropzone, { key: " " });
		await user.click(selectButton);

		expect(selectButton).toBeDisabled();
		expect(inputClickSpy).not.toHaveBeenCalled();
		expect(onFilesAccepted).not.toHaveBeenCalled();
	});

	it("opens the file dialog from keyboard interactions", () => {
		const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
		render(<FileDropzone onFilesAccepted={vi.fn()} onValidationError={vi.fn()} />);

		const dropzone = screen.getByRole("button", { name: "PBIX file dropzone" });
		fireEvent.keyDown(dropzone, { key: "Enter" });
		fireEvent.keyDown(dropzone, { key: " " });

		expect(inputClickSpy).toHaveBeenCalledTimes(2);
	});

	it("shows drag-active state while files are dragged over the dropzone", () => {
		render(<FileDropzone onFilesAccepted={vi.fn()} onValidationError={vi.fn()} />);

		const dropzone = screen.getByRole("button", { name: "PBIX file dropzone" });
		expect(screen.getByText("Drop PBIX files here")).toBeInTheDocument();

		fireEvent.dragEnter(dropzone);
		expect(screen.getByText("Drop files here")).toBeInTheDocument();
		expect(dropzone.className).toContain("border-(--app-accent-blue)");

		fireEvent.dragLeave(dropzone);
		expect(screen.getByText("Drop PBIX files here")).toBeInTheDocument();
	});
});
