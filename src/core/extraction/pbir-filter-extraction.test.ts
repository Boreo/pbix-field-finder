// src/core/extraction/pbir-filter-extraction.test.ts

import { describe, expect, it } from "vitest";
import type { PbirFilterConfig } from "../types/pbir";
import { extractPbirFilterRefs } from "./pbir-filter-extraction";

describe("extractPbirFilterRefs", () => {
	it("returns empty array for undefined filterConfig", () => {
		expect(extractPbirFilterRefs(undefined)).toEqual([]);
	});

	it("returns empty array for filterConfig with no filters array", () => {
		expect(extractPbirFilterRefs({})).toEqual([]);
	});

	it("returns empty array for empty filters array", () => {
		expect(extractPbirFilterRefs({ filters: [] })).toEqual([]);
	});

	it("extracts a Column filter as Entity.Property", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Column: {
							Expression: { SourceRef: { Entity: "Sales" } },
							Property: "Amount",
						},
					},
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([
			{ queryRef: "Sales.Amount", hidden: false },
		]);
	});

	it("extracts a Measure filter as Entity.Property", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Measure: {
							Expression: { SourceRef: { Entity: "Sales" } },
							Property: "Total Revenue",
						},
					},
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([
			{ queryRef: "Sales.Total Revenue", hidden: false },
		]);
	});

	it("extracts an Aggregation filter as Sum(Entity.Property)", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Aggregation: {
							Expression: {
								Column: {
									Expression: { SourceRef: { Entity: "Sales" } },
									Property: "SalesAmount",
								},
							},
							Function: 0,
						},
					},
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([
			{ queryRef: "Sum(Sales.SalesAmount)", hidden: false },
		]);
	});

	it("sets hidden: true when isHiddenInViewMode is true", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Column: {
							Expression: { SourceRef: { Entity: "Product" } },
							Property: "Category",
						},
					},
					isHiddenInViewMode: true,
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([
			{ queryRef: "Product.Category", hidden: true },
		]);
	});

	it("sets hidden: false when isHiddenInViewMode is false", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Column: {
							Expression: { SourceRef: { Entity: "Product" } },
							Property: "Category",
						},
					},
					isHiddenInViewMode: false,
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([
			{ queryRef: "Product.Category", hidden: false },
		]);
	});

	it("skips filters with no recognized field shape", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{ field: {} },
				{ name: "orphan-filter" },
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([]);
	});

	it("skips filters with missing field property", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{ isHiddenInViewMode: true },
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([]);
	});

	it("skips Column filter when Entity is missing", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Column: {
							Expression: { SourceRef: {} },
							Property: "Amount",
						},
					},
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([]);
	});

	it("skips Column filter when Property is missing", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Column: {
							Expression: { SourceRef: { Entity: "Sales" } },
						},
					},
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([]);
	});

	it("handles multiple filters and returns all valid refs", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Column: {
							Expression: { SourceRef: { Entity: "Sales" } },
							Property: "Amount",
						},
					},
				},
				{
					field: {
						Measure: {
							Expression: { SourceRef: { Entity: "Sales" } },
							Property: "Total",
						},
					},
					isHiddenInViewMode: true,
				},
				{ field: {} },
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([
			{ queryRef: "Sales.Amount", hidden: false },
			{ queryRef: "Sales.Total", hidden: true },
		]);
	});

	it("skips Aggregation filter when inner Column Entity is missing", () => {
		const filterConfig: PbirFilterConfig = {
			filters: [
				{
					field: {
						Aggregation: {
							Expression: {
								Column: {
									Expression: { SourceRef: {} },
									Property: "SalesAmount",
								},
							},
							Function: 0,
						},
					},
				},
			],
		};
		expect(extractPbirFilterRefs(filterConfig)).toEqual([]);
	});
});
