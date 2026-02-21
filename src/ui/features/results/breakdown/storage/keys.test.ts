import { describe, expect, it } from "vitest";
import {
	BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY,
	BREAKDOWN_SEARCH_STORAGE_KEY,
	BREAKDOWN_TAB_STORAGE_KEY,
} from "./keys";

describe("breakdown persistence keys", () => {
	it("keeps breakdown storage keys stable", () => {
		expect(BREAKDOWN_TAB_STORAGE_KEY).toBe("pbix-field-finder:breakdown-tab");
		expect(BREAKDOWN_SEARCH_STORAGE_KEY).toBe("pbix-field-finder:breakdown-search");
		expect(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY).toBe("pbix-field-finder:breakdown-search-locked");
	});
});
