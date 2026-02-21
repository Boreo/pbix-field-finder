import { describe, expect, it } from "vitest";
import {
	PAGE_FILTER_ROLE,
	PAGE_SENTINEL_VISUAL_TYPE,
	REPORT_FILTER_ROLE,
	REPORT_SENTINEL_PAGE_ID,
	REPORT_SENTINEL_PAGE_INDEX,
	REPORT_SENTINEL_PAGE_NAME,
	REPORT_SENTINEL_VISUAL_ID,
	REPORT_SENTINEL_VISUAL_TYPE,
	VISUAL_FILTER_ROLE,
} from "./constants";

describe("extraction constants", () => {
	it("keeps filter role constants stable", () => {
		expect(VISUAL_FILTER_ROLE).toBe("visual-filter");
		expect(PAGE_FILTER_ROLE).toBe("page-filter");
		expect(REPORT_FILTER_ROLE).toBe("report-filter");
	});

	it("keeps sentinel constants stable", () => {
		expect(PAGE_SENTINEL_VISUAL_TYPE).toBe("__PAGE__");
		expect(REPORT_SENTINEL_VISUAL_TYPE).toBe("__REPORT__");
		expect(REPORT_SENTINEL_VISUAL_ID).toBe("__REPORT__");
		expect(REPORT_SENTINEL_PAGE_ID).toBe("__REPORT__");
		expect(REPORT_SENTINEL_PAGE_NAME).toBe("Report");
		expect(REPORT_SENTINEL_PAGE_INDEX).toBe(-1);
	});
});
