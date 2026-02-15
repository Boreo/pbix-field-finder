// src/ui/features/preferences/components/AppHeader.tsx
import { Expand, Shrink } from "lucide-react";
import { ThemeToggle } from "../../../components/ThemeToggle";
import type { LayoutWidthMode, ThemeMode } from "../../../types";

type AppHeaderProps = {
	mode: ThemeMode;
	onToggleTheme: () => void;
	layoutWidthMode: LayoutWidthMode;
	onToggleLayoutWidth: () => void;
	showLayoutWidthToggle: boolean;
};

export function AppHeader({
	mode,
	onToggleTheme,
	layoutWidthMode,
	onToggleLayoutWidth,
	showLayoutWidthToggle,
}: AppHeaderProps) {
	return (
		<header className="flex flex-wrap items-center justify-between gap-3 px-1">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold text-(--app-fg-primary)">PBIX Field Analysis Tool</h1>
				<p className="text-sm text-(--app-fg-secondary)">
					Upload PBIX files to analyse field usage and export results.
				</p>
			</div>
			<div className="flex items-center gap-2">
				{showLayoutWidthToggle ? (
					<button
						type="button"
						onClick={onToggleLayoutWidth}
						className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-(--app-fg-secondary) transition-colors hover:text-(--app-fg-accent-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) disabled:cursor-not-allowed"
						aria-label={layoutWidthMode === "narrow" ? "Switch to full-width layout" : "Switch to narrow layout"}
						title={layoutWidthMode === "narrow" ? "Switch to full-width layout" : "Switch to narrow layout"}
					>
						{layoutWidthMode === "narrow" ? (
							<Expand aria-hidden="true" className="h-5 w-5" />
						) : (
							<Shrink aria-hidden="true" className="h-5 w-5" />
						)}
					</button>
				) : null}
				<ThemeToggle mode={mode} onToggle={onToggleTheme} />
			</div>
		</header>
	);
}
