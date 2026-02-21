import { describe, expect, it } from "vitest";
import { buildUnsupportedFilesMessage, splitSupportedPbixFiles } from "./fileSelection";

describe("fileSelection", () => {
	it("splits supported pbix and zip files from unsupported files", () => {
		const sales = new File(["x"], "sales.pbix");
		const finance = new File(["x"], "finance.ZIP");
		const text = new File(["x"], "notes.txt");

		const { accepted, rejected } = splitSupportedPbixFiles([sales, finance, text]);

		expect(accepted).toEqual([sales, finance]);
		expect(rejected).toEqual([text]);
	});

	it("builds unsupported-files message using file names", () => {
		const files = [new File(["x"], "a.txt"), new File(["x"], "b.csv")];
		expect(buildUnsupportedFilesMessage(files)).toBe("Unsupported files: a.txt, b.csv.");
	});
});
