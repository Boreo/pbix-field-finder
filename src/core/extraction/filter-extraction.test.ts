import { describe, expect, it } from "vitest";
import { extractFilterRefs } from "./filter-extraction";

describe("extractFilterRefs", () => {
	it("returns empty for missing or malformed payloads", () => {
		expect(extractFilterRefs(undefined)).toEqual([]);
		expect(extractFilterRefs("{bad json")).toEqual([]);
		expect(extractFilterRefs("{}")).toEqual([]);
	});

	it("extracts column filter refs", () => {
		const filters = JSON.stringify([
			{
				expression: {
					Column: {
						Expression: { SourceRef: { Entity: "Sales" } },
						Property: "Amount",
					},
				},
			},
		]);

		expect(extractFilterRefs(filters)).toEqual([
			{ queryRef: "Sales.Amount", hidden: false },
		]);
	});

	it("extracts aggregation-shaped filters as expression refs", () => {
		const filters = JSON.stringify([
			{
				expression: {
					Aggregation: {
						Expression: {
							Column: {
								Expression: { SourceRef: { Entity: "Sales" } },
								Property: "Amount",
							},
						},
					},
				},
			},
		]);

		expect(extractFilterRefs(filters)).toEqual([
			{ queryRef: "Sum(Sales.Amount)", hidden: false },
		]);
	});

	it("propagates hidden flags and skips incomplete column nodes", () => {
		const filters = JSON.stringify([
			{
				isHiddenInViewMode: true,
				expression: {
					Column: {
						Expression: { SourceRef: { Entity: "Sales" } },
						Property: "Amount",
					},
				},
			},
			{
				expression: {
					Column: {
						Expression: { SourceRef: { Entity: "Sales" } },
					},
				},
			},
		]);

		expect(extractFilterRefs(filters)).toEqual([
			{ queryRef: "Sales.Amount", hidden: true },
		]);
	});
});
