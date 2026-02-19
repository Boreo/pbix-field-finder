import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BatchStatusSection } from "./BatchStatusSection";

describe("BatchStatusSection", () => {
	it("returns null when no batch status exists", () => {
		const { queryByTestId } = render(<BatchStatusSection batchStatus={null} />);
		expect(queryByTestId("batch-status")).toBeNull();
	});

	it("renders success and failure summary text", () => {
		render(
			<BatchStatusSection
				batchStatus={{
					total: 3,
					successCount: 2,
					failures: [{ fileName: "bad.pbix", message: "The PBIX file does not contain a report layout." }],
				}}
			/>,
		);

		expect(screen.getByText("Processed 3 files: 2 succeeded, 1 failed.")).toBeInTheDocument();
		expect(screen.getByText("2 succeeded")).toBeInTheDocument();
		expect(screen.getByText("1 failed")).toBeInTheDocument();
		expect(
			screen.getByText("bad.pbix: The PBIX file does not contain a report layout."),
		).toBeInTheDocument();
	});
});
