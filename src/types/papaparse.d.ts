// src/types/papaparse.d.ts
// Ambient types — papaparse ships without unparse typings.
declare module "papaparse" {
	export type UnparseInput =
		| Array<Record<string, unknown>>
		| {
				fields?: string[];
				data: Array<Array<string | number | boolean | null>>;
		  };

	export type UnparseConfig = {
		newline?: string;
	};

	type Papa = {
		unparse(input: UnparseInput, config?: UnparseConfig): string;
	};

	const papa: Papa;
	export default papa;
}
