// src/core/types/pbir.ts
// Mirrors the PBIR (Power BI Enhanced Report Format) JSON file shapes under Report/definition/.
// These types are intentionally permissive (optional fields) to tolerate schema evolution.

// ─── Shared field expression types ──────────────────────────────────────────

export interface PbirColumnExpr {
	Expression?: {
		SourceRef?: {
			Entity?: string;
		};
	};
	Property?: string;
}

export interface PbirMeasureExpr {
	Expression?: {
		SourceRef?: {
			Entity?: string;
		};
	};
	Property?: string;
}

export interface PbirAggregationExpr {
	Expression?: PbirFieldExpr;
	Function?: number;
}

/** Structured field expression used across PBIR projections and filters. */
export interface PbirFieldExpr {
	Column?: PbirColumnExpr;
	Measure?: PbirMeasureExpr;
	Aggregation?: PbirAggregationExpr;
}

// ─── Filter types ────────────────────────────────────────────────────────────

export interface PbirFilter {
	name?: string;
	field?: PbirFieldExpr;
	type?: "Categorical" | "Advanced" | string;
	howCreated?: "User" | "Drillthrough" | string;
	isHiddenInViewMode?: boolean;
}

export interface PbirFilterConfig {
	filters?: PbirFilter[];
}

// ─── Visual types ────────────────────────────────────────────────────────────

export interface PbirProjection {
	field?: PbirFieldExpr;
	queryRef?: string;
	displayName?: string;
	active?: boolean;
}

export interface PbirQueryRoleState {
	projections?: PbirProjection[];
}

/** Maps visual role name → role state with projections. */
export type PbirQueryState = Record<string, PbirQueryRoleState | undefined>;

/**
 * Represents a parsed visual.json file inside PBIR.
 *
 * NOTE: The structural layout of PBIR visual.json differs significantly from legacy:
 * - `visualType` lives under `visual.visualType` (not root)
 * - `query.queryState` lives under `visual.query.queryState` (not root)
 * - `filterConfig` lives at the ROOT level (not under `visual`)
 * - `isHidden` is a root-level boolean flag
 * - Visual title is at `visual.visualContainerObjects.title[0].properties.text.expr.Literal.Value`
 */
export interface PbirVisualJson {
	$schema?: string;
	name?: string;
	position?: {
		x?: number;
		y?: number;
		z?: number;
		width?: number;
		height?: number;
		tabOrder?: number;
	};
	visual?: {
		visualType?: string;
		query?: {
			queryState?: PbirQueryState;
		};
		visualContainerObjects?: {
			title?: Array<{
				properties?: {
					text?: {
						expr?: {
							Literal?: {
								Value?: string;
							};
						};
					};
				};
			}>;
		};
		objects?: Record<string, unknown>;
	};
	/** Visual-level filters live at the top level of visual.json (not under `visual`). */
	filterConfig?: PbirFilterConfig;
	/** Top-level flag; when true the visual is hidden from report view. */
	isHidden?: boolean;
}

// ─── Page types ──────────────────────────────────────────────────────────────

export type PageBindingType = "Default" | "Drillthrough" | "Tooltip" | "Parameters";

/**
 * A single drillthrough parameter entry inside pageBinding.parameters.
 * When a `fieldExpr` is present, this parameter represents a drillthrough target field.
 */
export interface PbirPageBindingParameter {
	name?: string;
	boundFilter?: string;
	fieldExpr?: PbirFieldExpr;
}

export interface PbirPageBinding {
	name?: string;
	type?: PageBindingType;
	/** Present on Drillthrough pages; each entry with a `fieldExpr` is a target field. */
	parameters?: PbirPageBindingParameter[];
	referenceScope?: string;
}

export interface PbirPageJson {
	$schema?: string;
	name?: string;
	displayName?: string;
	displayOption?: string;
	height?: number;
	width?: number;
	pageBinding?: PbirPageBinding;
	filterConfig?: PbirFilterConfig;
	objects?: Record<string, unknown>;
}

// ─── Pages index types ───────────────────────────────────────────────────────

/**
 * Represents the Report/definition/pages/pages.json file.
 * NOTE: The ordering array key is `pageOrder`, not `pages`.
 */
export interface PbirPagesJson {
	/** Ordered list of page folder IDs (the display order of pages in the report). */
	pageOrder?: string[];
	activePageName?: string;
}

// ─── Report-level types ──────────────────────────────────────────────────────

export interface PbirReportJson {
	$schema?: string;
	filterConfig?: PbirFilterConfig;
	themeCollection?: unknown;
	objects?: Record<string, unknown>;
	settings?: Record<string, unknown>;
	resourcePackages?: unknown[];
}
