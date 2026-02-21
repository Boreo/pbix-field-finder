// src/ui/features/preferences/hooks/useTablePreferences.ts
import { useEffect, useState } from "react";
import type { LayoutWidthMode, TableDensity } from "@/ui/shared";
import {
	LAYOUT_WIDTH_MODE_STORAGE_KEY,
	TABLE_DENSITY_STORAGE_KEY,
} from "../storage/keys";

function isTableDensity(value: string | null): value is TableDensity {
	return value === "comfortable" || value === "compact";
}

function isLayoutWidthMode(value: string | null): value is LayoutWidthMode {
	return value === "fill" || value === "narrow";
}

function getStoredDensity(): TableDensity {
	if (typeof window === "undefined") return "comfortable";
	const stored = window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY);
	return isTableDensity(stored) ? stored : "comfortable";
}

function getStoredLayoutWidthMode(): LayoutWidthMode {
	if (typeof window === "undefined") return "fill";
	const stored = window.localStorage.getItem(LAYOUT_WIDTH_MODE_STORAGE_KEY);
	return isLayoutWidthMode(stored) ? stored : "fill";
}

/**
 * Manage persisted table density and layout-width preferences for the results UI.
 * WARNING: This hook writes both preferences to `localStorage` whenever either value changes.
 * @returns Current preference values and setters used by layout and table controls.
 */
export function useTablePreferences() {
	const [density, setDensity] = useState<TableDensity>(() => getStoredDensity());
	const [layoutWidthMode, setLayoutWidthMode] = useState<LayoutWidthMode>(() => getStoredLayoutWidthMode());

	useEffect(() => {
		window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, density);
	}, [density]);

	useEffect(() => {
		window.localStorage.setItem(LAYOUT_WIDTH_MODE_STORAGE_KEY, layoutWidthMode);
	}, [layoutWidthMode]);

	return {
		density,
		setDensity,
		layoutWidthMode,
		setLayoutWidthMode,
	};
}
