// src/ui/hooks/useTheme.ts
// Fallback chain: localStorage -> system preference -> "mocha".
// Side-effect: sets the theme class on <html> so CSS vars resolve correctly.
import { useCallback, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "../features/preferences/persistenceKeys";
import type { ThemeMode } from "../types";

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
