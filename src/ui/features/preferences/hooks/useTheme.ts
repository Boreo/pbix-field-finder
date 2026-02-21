// src/ui/features/preferences/hooks/useTheme.ts
// Fallback chain: localStorage -> system preference -> "mocha".
// Side-effect: sets the theme class on <html> so CSS vars resolve correctly.
import { useCallback, useEffect, useState } from "react";
import type { ThemeMode } from "@/ui/shared";
import { THEME_STORAGE_KEY } from "../storage/keys";

function isThemeMode(value: string | null): value is ThemeMode {
	return value === "latte" || value === "mocha";
}

function getSystemTheme(fallback: ThemeMode): ThemeMode {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return fallback;
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "mocha" : "latte";
}

function getStoredTheme(fallback: ThemeMode): ThemeMode {
	if (typeof window === "undefined") return fallback;
	const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (isThemeMode(stored)) return stored;
	return getSystemTheme(fallback);
}

/**
 * Manage persisted app theme mode with system-preference fallback.
 * WARNING: This hook writes to `localStorage` and mutates `<html>` classes as a deliberate UI side effect.
 * @param defaultMode Fallback theme used when no stored or detectable system preference is available.
 * @returns The active theme mode plus a toggle handler for switching between light and dark themes.
 */
export function useTheme(defaultMode: ThemeMode = "mocha") {
	const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme(defaultMode));

	useEffect(() => {
		window.localStorage.setItem(THEME_STORAGE_KEY, mode);
		const root = document.documentElement;
		root.classList.remove("latte", "mocha");
		root.classList.add(mode);
	}, [mode]);

	const toggleMode = useCallback(() => {
		setMode((current) => (current === "mocha" ? "latte" : "mocha"));
	}, []);

	return { mode, toggleMode };
}
