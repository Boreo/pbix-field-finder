// pivot-renderer.ts

import type { Pivot, FieldKey } from "../core/types";

export function renderPivotTable(pivot: Pivot, pages: string[], fieldOrder: FieldKey[]): HTMLTableElement {
	const tableEl = document.createElement("table");
	tableEl.border = "1";
	tableEl.style.borderCollapse = "collapse";

	const thead = tableEl.createTHead();
	const headerRow = thead.insertRow();

	["Report", "Table", "Field", ...pages, "Total"].forEach((h) => {
		const th = document.createElement("th");
		th.textContent = h;
		th.style.padding = "4px 8px";
		headerRow.appendChild(th);
	});

	const tbody = tableEl.createTBody();

	for (const key of fieldOrder) {
		const [report, tableName, fieldName] = key.split("|");
		const pageCounts = pivot[report][tableName][fieldName];

		const row = tbody.insertRow();
		row.insertCell().textContent = report;
		row.insertCell().textContent = tableName;
		row.insertCell().textContent = fieldName;

		let rowTotal = 0;

		for (const page of pages) {
			const value = pageCounts[page] ?? 0;
			rowTotal += value;

			const cell = row.insertCell();
			cell.textContent = String(value);
			cell.style.textAlign = "right";
		}

		const totalCell = row.insertCell();
		totalCell.textContent = String(rowTotal);
		totalCell.style.fontWeight = "bold";
	}

	return tableEl;
}
