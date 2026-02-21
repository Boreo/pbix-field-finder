import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IngestSection } from "./IngestSection";

const mocks = vi.hoisted(() => ({
	fileDropzone: vi.fn(),
	filesStrip: vi.fn(),
}));

vi.mock("./FileDropzone", () => ({
	FileDropzone: (props: unknown) => {
		mocks.fileDropzone(props);
		return <button type="button" data-testid="mock-dropzone">dropzone</button>;
	},
}));

vi.mock("./FilesStrip", () => ({
	FilesStrip: (props: unknown) => {
		mocks.filesStrip(props);
		return <button type="button" data-testid="mock-files-strip">files-strip</button>;
	},
}));

describe("IngestSection", () => {
	it("shows dropzone when no files are loaded", () => {
		render(
			<IngestSection
				loadedFiles={[]}
				isProcessing={false}
				validationMessage={null}
				onFilesAccepted={vi.fn()}
				onRemoveFile={vi.fn()}
				onClearFiles={vi.fn()}
				onToggleFileVisibility={vi.fn()}
				onValidationError={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("mock-dropzone")).toBeInTheDocument();
		expect(screen.queryByTestId("mock-files-strip")).toBeNull();
	});

	it("shows files strip when files are loaded and forwards handlers", async () => {
		const user = userEvent.setup();
		const onFilesAccepted = vi.fn();
		const onRemoveFile = vi.fn();
		const onClearFiles = vi.fn();
		const onToggleFileVisibility = vi.fn();
		const onValidationError = vi.fn();

		render(
			<IngestSection
				loadedFiles={[
					{
						id: "file-1",
						file: new File(["x"], "sales.pbix"),
						baseReportName: "sales",
						reportName: "sales",
						visible: true,
						errorMessage: null,
					},
				]}
				isProcessing
				validationMessage="Unsupported files: notes.txt."
				onFilesAccepted={onFilesAccepted}
				onRemoveFile={onRemoveFile}
				onClearFiles={onClearFiles}
				onToggleFileVisibility={onToggleFileVisibility}
				onValidationError={onValidationError}
			/>,
		);

		expect(screen.queryByTestId("mock-dropzone")).toBeNull();
		expect(screen.getByTestId("mock-files-strip")).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveTextContent("Processing files...");
		expect(screen.getByRole("alert")).toHaveTextContent("Unsupported files: notes.txt.");

		const filesStripProps = mocks.filesStrip.mock.calls[0]?.[0] as {
			onAddFiles: (files: File[]) => void;
			onRemoveFile: (id: string) => void;
			onClearFiles: () => void;
			onToggleFileVisibility: (id: string) => void;
			onValidationError: (message: string) => void;
		};

		filesStripProps.onAddFiles([new File(["y"], "finance.pbix")]);
		filesStripProps.onRemoveFile("file-1");
		filesStripProps.onClearFiles();
		filesStripProps.onToggleFileVisibility("file-1");
		filesStripProps.onValidationError("bad");

		expect(onFilesAccepted).toHaveBeenCalledTimes(1);
		expect(onRemoveFile).toHaveBeenCalledWith("file-1");
		expect(onClearFiles).toHaveBeenCalledTimes(1);
		expect(onToggleFileVisibility).toHaveBeenCalledWith("file-1");
		expect(onValidationError).toHaveBeenCalledWith("bad");

		await user.click(screen.getByTestId("mock-files-strip"));
	});
});
