// main.ts

import { loadPbixLayout } from "./io/pbix-loader";
import { extractVisualFieldUsage, buildFieldUsageTable , buildPivot, renderPivotTable } from "./core/report-analyser";
import { isPbixError } from "./core/errors";
import type { PbixLayout } from "./core/types";

const input = document.createElement("input");
input.type = "file";
input.accept = ".pbix,.zip";



input.addEventListener("change", async () => {
	const file = input.files?.[0];
	if (!file) return;

	let layout: PbixLayout;

	try {
		const layout = await loadPbixLayout(file);

		const visualUsage = extractVisualFieldUsage(layout);
		console.table(visualUsage);

		const fieldUsageTable = buildFieldUsageTable(visualUsage, file.name.replace(/\.(pbix|zip)$/i, ""));
		console.table(fieldUsageTable);

  const { pivot, pages, fieldOrder } = buildPivot(fieldUsageTable, visualUsage);
		const tableEl = renderPivotTable(pivot, pages, fieldOrder);

		document.body.appendChild(tableEl);
	} catch (err) {
		if (isPbixError(err)) {
			err.show();
			return;
		}
		throw err;
	}
});

document.body.appendChild(input);
