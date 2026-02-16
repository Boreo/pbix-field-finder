import { describe, expect, it } from "vitest";
import { classifyField } from "./field-classifier";
import type { PrototypeSelectItem } from "./raw-field-usage";

describe("classifyField", () => {
	it("prefers prototype metadata over shape-based inference", () => {
		const prototypeSelect: PrototypeSelectItem[] = [
			{ Name: " Sales.Amount ", kind: "measure" },
		];

		expect(classifyField("Sales.Amount", prototypeSelect)).toBe("measure");
	});

	it("classifies aggregation and expression patterns as measure", () => {
		expect(classifyField("Sum(Sales.Amount)", [])).toBe("measure");
		expect(classifyField("CustomFn(Sales.Amount)", [])).toBe("measure");
	});

	it("classifies context binding", () => {
		expect(classifyField(".", [])).toBe("context");
	});

	it("classifies plain table-field refs as column", () => {
		expect(classifyField("Sales.Amount", [])).toBe("column");
	});

	it("falls back to unknown for unsupported refs", () => {
		expect(classifyField("AmountOnly", [])).toBe("unknown");
	});
});
