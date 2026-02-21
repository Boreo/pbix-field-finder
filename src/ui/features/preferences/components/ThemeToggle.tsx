// src/ui/features/preferences/components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "@/ui/shared";

type ThemeToggleProps = {
	mode: ThemeMode;
	onToggle: () => void;
};

/**
 * Render a two-state control for switching between light and dark themes.
 * @param props Theme-toggle props with the active mode and toggle handler.
 * @param props.mode Current active theme mode used to determine icon and labels.
 * @param props.onToggle Invoked when the user requests a theme switch.
 * @returns A themed switch control for toggling app colour mode.
 */
export function ThemeToggle({ mode, onToggle }: ThemeToggleProps) {
	const isDark = mode === "mocha";
	const nextModeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={nextModeLabel}
			title={nextModeLabel}
			aria-pressed={isDark}
			className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-(--app-fg-secondary) transition-colors hover:text-(--app-link) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) disabled:cursor-not-allowed"
		>
			{isDark ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}
		</button>
	);
}
