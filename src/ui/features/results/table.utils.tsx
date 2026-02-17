// src/ui/features/results/table.utils.tsx
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export function sortIcon(sortState: false | "asc" | "desc") {
	if (sortState === "asc") return <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />;
	if (sortState === "desc") return <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />;
	return <ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" />;
}

export function toAriaSort(sortState: false | "asc" | "desc"): "none" | "ascending" | "descending" {
	if (sortState === "asc") return "ascending";
	if (sortState === "desc") return "descending";
	return "none";
}

export function zebraRowClass(index: number) {
	return index % 2 === 0 ? "bg-[var(--app-zebra-row-first)]" : "bg-[var(--app-zebra-row-second)]";
}

export function breakdownCellPadding(density: "compact" | "comfortable") {
	return density === "compact" ? "px-2 py-1" : "px-2 py-1.5";
}
