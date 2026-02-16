import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PbixFilter, PbixLayout } from "../../core/types";

const LAYOUT_FIXTURE_PATH = resolve(process.cwd(), "src", "test", "fixtures", "Layout");

export function readLayoutFixture(): PbixLayout {
	const layoutText = readFileSync(LAYOUT_FIXTURE_PATH, "utf16le");
	return JSON.parse(layoutText) as PbixLayout;
}

export function readLayoutFixtureFilters(): PbixFilter[] {
	const layout = readLayoutFixture();
	if (!layout.filters) {
		return [];
	}

	const parsed = JSON.parse(layout.filters);
	return Array.isArray(parsed) ? (parsed as PbixFilter[]) : [];
}

export const layoutFixturePath = LAYOUT_FIXTURE_PATH;
