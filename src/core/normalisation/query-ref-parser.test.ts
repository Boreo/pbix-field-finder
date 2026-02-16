import { describe, expect, it } from "vitest";
import { parseQueryRef } from "./query-ref-parser";

describe("parseQueryRef", () => {
	it("parses plain table-field query refs", () => {
		expect(parseQueryRef("Sales.Amount")).toEqual({
			table: "Sales",
			field: "Amount",
			expression: null,
			isExpression: false,
		});
	});

	it("normalises whitespace around table and field segments", () => {
		expect(parseQueryRef("  Sales  .  Amount  ")).toEqual({
			table: "Sales",
			field: "Amount",
			expression: null,
			isExpression: false,
		});
	});

	it("parses expression refs and keeps raw expression text", () => {
		expect(parseQueryRef("Sum(Sales.Amount)")).toEqual({
			table: "Sales",
			field: "Amount",
			expression: "Sum(Sales.Amount)",
			isExpression: true,
		});
	});

	it("handles expressions without table-field segments", () => {
		expect(parseQueryRef("CountRows()")).toEqual({
			table: null,
			field: null,
			expression: "CountRows()",
			isExpression: true,
		});
	});

	it("falls back to a single field token when no table segment exists", () => {
		expect(parseQueryRef("Amount")).toEqual({
			table: null,
			field: "Amount",
			expression: null,
			isExpression: false,
		});
	});
});
