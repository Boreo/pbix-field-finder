// src/ui/features/export/useExportActions.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { NormalisedFieldUsage } from "../../../core/normalisation/field-normaliser";
import type { SummaryRow } from "../../../core/projections";
import { useExportActions } from "./useExportActions";

const mocks = vi.hoisted(() => ({
	exportSummaryJson: vi.fn(),
	exportRawCsv: vi.fn(),
	exportDetailsJson: vi.fn(),
}));

vi.mock("../../../io/data-export", () => ({
	exportSummaryJson: mocks.exportSummaryJson,
	exportRawCsv: mocks.exportRawCsv,
	exportDetailsJson: mocks.exportDetailsJson,
}));

const summaryRows: SummaryRow[] = [
	{
		id: "summary:Orders|Amount",
		table: "Orders",
		field: "Amount",
		totalUses: 1,
		reportCount: 1,
		pageCount: 1,
		visualCount: 1,
		hiddenOnly: false,
		kind: "measure",
		reports: [],
		searchText: "orders amount",
	},
];

const normalisedRows: NormalisedFieldUsage[] = [
	{
		report: "Sales",
		page: "Overview",
		pageIndex: 0,
		visualType: "table",
		visualId: "v1",
		visualTitle: "Orders by Amount",
		role: "values",
		table: "Orders",
		field: "Amount",
		fieldKind: "measure",
		expression: null,
		isHiddenVisual: false,
		isHiddenFilter: false,
	},
];

describe("useExportActions", () => {
	it("wires export handlers to data-export functions", () => {
		const { result } = renderHook(() =>
			useExportActions({
				summaryRows,
				normalisedRows,
				exportScopeLabel: "Sales",
			}),
		);

		act(() => {
			result.current.onExportSummaryJson();
			result.current.onExportRawCsv();
			result.current.onExportDetailsJson();
		});

		expect(mocks.exportSummaryJson).toHaveBeenCalledWith(summaryRows, "Sales");
		expect(mocks.exportRawCsv).toHaveBeenCalledWith(normalisedRows, "Sales");
		expect(mocks.exportDetailsJson).toHaveBeenCalledWith(normalisedRows, "Sales");
	});
});
