// src/ui/components/ThemeToggle.tsx
import { Switch } from "@headlessui/react";
import { Moon, Sun } from "lucide-react";
import type { ThemeMode } from "../types";

type ThemeToggleProps = {
	mode: ThemeMode;
	onToggle: () => void;
};

export function ThemeToggle({ mode, onToggle }: ThemeToggleProps) {
	const isDark = mode === "mocha";
	const nextModeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

	return (
		<Switch
			checked={isDark}
			onChange={onToggle}
			aria-label={nextModeLabel}
			title={nextModeLabel}
			className={`relative inline-flex h-8 w-14 cursor-pointer items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) ${
				isDark
					? "border-(--app-accent) bg-[color-mix(in_srgb,var(--app-accent)_28%,var(--color-ctp-surface0))]"
					: "border-ctp-surface2 bg-ctp-surface0"
			}`}
		>
			<span className="sr-only">{isDark ? "Dark mode enabled" : "Light mode enabled"}</span>
			<span
				aria-hidden="true"
				className={`absolute left-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ctp-base shadow transition-transform ${
					isDark ? "translate-x-6 text-(--app-fg-warning)" : "translate-x-0 text-(--app-fg-accent-text)"
				}`}
			>
				{isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
			</span>
		</Switch>
	);
}
