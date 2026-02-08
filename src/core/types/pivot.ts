export type Pivot = {
	[report: string]: {
		[table: string]: {
			[field: string]: {
				[page: string]: number;
			};
		};
	};
};

export type FieldKey = string; // "report|table|field"
