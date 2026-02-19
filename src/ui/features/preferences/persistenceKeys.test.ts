import { describe, expect, it } from "vitest";
import {
	AUTO_WIDE_SUPPRESS_STORAGE_KEY,
	BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY,
	BREAKDOWN_SEARCH_STORAGE_KEY,
	BREAKDOWN_TAB_STORAGE_KEY,
	LAYOUT_WIDTH_MODE_STORAGE_KEY,
	TABLE_DENSITY_STORAGE_KEY,
	THEME_STORAGE_KEY,
} from "./persistenceKeys";

describe("persistence keys", () => {
	it("keeps all storage keys stable", () => {
		expect(THEME_STORAGE_KEY).toBe("pbix-field-finder:theme");
		expect(TABLE_DENSITY_STORAGE_KEY).toBe("pbix-field-finder:table-density");
		expect(LAYOUT_WIDTH_MODE_STORAGE_KEY).toBe("pbix-field-finder:layout-width");
		expect(AUTO_WIDE_SUPPRESS_STORAGE_KEY).toBe("pbix-field-finder:auto-wide-suppress");
		expect(BREAKDOWN_TAB_STORAGE_KEY).toBe("pbix-field-finder:breakdown-tab");
		expect(BREAKDOWN_SEARCH_STORAGE_KEY).toBe("pbix-field-finder:breakdown-search");
		expect(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY).toBe("pbix-field-finder:breakdown-search-locked");
	});
});
