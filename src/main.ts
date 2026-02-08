// main.ts

import { loadPbixLayout } from "./io/pbix-loader";
import { analyseReport } from "./core/report-analyser";
import { renderPivotTable } from "./ui/pivot-renderer";
import { buildPivotFromNormalised } from "./core/aggregation/pivot-builder";
import { isPbixError } from "./core/errors";

const input = document.createElement("input");
input.type = "file";
input.accept = ".pbix,.zip";

input.addEventListener("change", async () => {
	const file = input.files?.[0];
	if (!file) return;

	try {
		const layout = await loadPbixLayout(file);
		const reportName = file.name.replace(/\.(pbix|zip)$/i, "");

		const { normalised } = analyseReport(layout, reportName);

		// Build pivot from normalised data
		const { pivot, pages, fieldOrder } = buildPivotFromNormalised(normalised);
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
