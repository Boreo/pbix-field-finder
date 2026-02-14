// src/ui/components/FileDropzone.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileDropzone } from "./FileDropzone";

describe("FileDropzone", () => {
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
});
