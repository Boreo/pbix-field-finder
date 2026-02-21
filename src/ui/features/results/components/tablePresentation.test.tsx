import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { describe, expect, it } from "vitest";
import { breakdownCellPadding, sortIcon, toAriaSort, zebraRowClass } from "./tablePresentation";

describe("table.utils", () => {
	it("maps sort state to the expected icon", () => {
		expect(sortIcon("asc").type).toBe(ArrowUp);
		expect(sortIcon("desc").type).toBe(ArrowDown);
		expect(sortIcon(false).type).toBe(ArrowUpDown);
	});

	it("maps sort state to aria-sort values", () => {
		expect(toAriaSort("asc")).toBe("ascending");
		expect(toAriaSort("desc")).toBe("descending");
		expect(toAriaSort(false)).toBe("none");
	});

	it("returns zebra row classes by parity", () => {
		expect(zebraRowClass(0)).toBe("bg-[var(--app-zebra-row-first)]");
		expect(zebraRowClass(1)).toBe("bg-[var(--app-zebra-row-second)]");
		expect(zebraRowClass(4)).toBe("bg-[var(--app-zebra-row-first)]");
	});

	it("returns breakdown cell padding by density", () => {
		expect(breakdownCellPadding("comfortable")).toBe("px-2 py-1.5");
		expect(breakdownCellPadding("compact")).toBe("px-2 py-1");
	});
});

