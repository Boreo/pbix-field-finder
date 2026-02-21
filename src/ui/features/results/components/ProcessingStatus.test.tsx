// src/ui/components/ProcessingStatus.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProcessingStatus } from "./ProcessingStatus";

describe("ProcessingStatus", () => {
	it("renders warning-ready status when there are processing errors", () => {
		render(
			<ProcessingStatus
				status="ready"
				fileCount={2}
				fieldCount={10}
				tableCount={3}
				failureCount={1}
			/>,
		);

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Ready · 10 fields across 3 tables - with 1 error");
		expect(status).toHaveAttribute("aria-live", "polite");
		expect(status.className).toContain("text-(--app-fg-warning)");
	});

	it("renders standard ready status when there are no errors", () => {
		render(
			<ProcessingStatus
				status="ready"
				fileCount={1}
				fieldCount={1}
				tableCount={1}
				failureCount={0}
			/>,
		);

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Ready · 1 field across 1 table");
		expect(status.className).toContain("text-(--app-fg-success)");
	});

	it("renders error state when processing fully fails", () => {
		render(
			<ProcessingStatus
				status="error"
				fileCount={1}
				fieldCount={0}
				tableCount={0}
				failureCount={1}
			/>,
		);

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Failed to process file");
		expect(status).toHaveAttribute("aria-live", "assertive");
	});
});
