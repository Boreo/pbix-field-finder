import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NormalisedFieldUsage } from "../core/normalisation/field-normaliser";
import { exportRawCsv } from "./data-export";

const mocks = vi.hoisted(() => ({
	unparse: vi.fn(() => "report,page\nSales,Overview"),
}));

vi.mock("papaparse", () => ({
	default: {
		unparse: mocks.unparse,
	},
}));

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe("data-export raw csv", () => {
	let clickSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.unparse.mockReturnValue("report,page\nSales,Overview");

		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			writable: true,
			value: vi.fn(() => "blob:raw-csv"),
		});
		Object.defineProperty(URL, "revokeObjectURL", {
			configurable: true,
			writable: true,
			value: vi.fn(),
		});
		clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
	});

	afterEach(() => {
		clickSpy.mockRestore();
		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			writable: true,
			value: originalCreateObjectURL,
		});
		Object.defineProperty(URL, "revokeObjectURL", {
			configurable: true,
			writable: true,
			value: originalRevokeObjectURL,
		});
	});

	it("keeps fieldKind/expression and omits expressionComponents in csv fields", async () => {
		const rows: NormalisedFieldUsage[] = [
			{
				report: "Sales",
				page: "Overview",
				pageIndex: 0,
				visualType: "card",
				visualId: "visual-1",
				visualTitle: "Amount Card",
				role: "values",
				table: "Sales",
				field: "Amount",
				fieldKind: "measure",
				expression: "Sum(Sales.Amount)",
				isHiddenVisual: false,
				isHiddenFilter: false,
			},
		];

		exportRawCsv(rows, "Sales");

		await waitFor(() => expect(mocks.unparse).toHaveBeenCalledTimes(1));

		const [payload] = mocks.unparse.mock.calls[0] as [{
			fields: string[];
			data: Array<Array<string | number | boolean | null>>;
		}];

		expect(payload.fields).toContain("fieldKind");
		expect(payload.fields).toContain("expression");
		expect(payload.fields).not.toContain("expressionComponents");
		expect(payload.fields).toEqual([
			"report",
			"page",
			"pageIndex",
			"visualType",
			"visualId",
			"visualTitle",
			"role",
			"table",
			"field",
			"fieldKind",
			"expression",
			"isHiddenVisual",
			"isHiddenFilter",
		]);
	});
});
