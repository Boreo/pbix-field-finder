// src/core/types/pbix.ts
// Mirrors relevant shapes from the Report/Layout JSON inside a .pbix archive.

export type JsonObject = Record<string, unknown>;

export interface PbixLayout {
	id: number;
	reportId: number;
	filters?: string;
	config?: string;
	sections?: PbixSection[];
}

export interface PbixSection {
	name: string;
	displayName?: string;
	visualContainers?: PbixVisualContainer[];
	displayOption?: "Default" | "Tooltip";
	filters?: string;
}

export interface PbixVisualContainer {
	id: string;
	config?: string | PbixVisualConfig;
	filters?: string;
}

export type PbixProjectionItem = {
	queryRef?: string;
};

export type PbixPrototypeSelectItem = {
	Name?: string;
	Column?: unknown;
	Measure?: unknown;
	Aggregation?: unknown;
};

export interface PbixVisualConfig {
	name?: string;
	singleVisual?: {
		visualType?: string;
		projections?: Record<string, PbixProjectionItem[] | undefined>;
		prototypeQuery?: {
			Select?: PbixPrototypeSelectItem[];
		};
		display?: {
			mode?: string;
		};
		vcObjects?: {
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
	};
}

export interface PbixFilter {
	expression?: PbixFilterExpression;
	isHiddenInViewMode?: boolean;
}

export interface PbixFilterExpression {
	Column?: PbixColumnExpression;
	Aggregation?: {
		Expression?: {
			Column?: PbixColumnExpression;
		};
	};
}

export interface PbixColumnExpression {
	Property?: string;
	Expression?: {
		SourceRef?: {
			Entity?: string;
		};
	};
}
