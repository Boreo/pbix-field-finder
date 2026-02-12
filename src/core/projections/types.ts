// src/core/projections/types.ts
// Keep stable — UI components and export functions depend on these fields.
import type { FieldKind } from "../extraction/field-classifier";

export type CanonicalUsageRow = {
	id: string;
	report: string;
	page: string;
	pageIndex: number;
	visualType: string;
	visualId: string;
	visualTitle: string;
	role: string;
	table: string;
	field: string;
	kind: FieldKind;
	isHiddenVisual: boolean;
	isHiddenFilter: boolean;
	hiddenUsage: boolean;
	reportPageKey: string;
	reportVisualKey: string;
	searchText: string;
};

export type SummaryReportPageBreakdown = {
	page: string;
	pageIndex: number;
	count: number;
	distinctVisuals: number;
};

export type SummaryReportBreakdown = {
	report: string;
	totalUses: number;
	pageCount: number;
	visualCount: number;
	pages: SummaryReportPageBreakdown[];
};

export type SummaryRow = {
	id: string;
	table: string;
	field: string;
	totalUses: number;
	reportCount: number;
	pageCount: number;
	visualCount: number;
	hiddenOnly: boolean;
	kind: FieldKind;
	reports: SummaryReportBreakdown[];
	searchText: string;
};

export type DetailsRow = {
	id: string;
	report: string;
	page: string;
	pageIndex: number;
	table: string;
	field: string;
	totalUses: number;
	distinctVisuals: number;
	roles: string[];
	visualTypes: string[];
	kind: FieldKind;
	hiddenUsageCount: number;
	hiddenOnly: boolean;
	searchText: string;
};
