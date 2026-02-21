import { cn } from "@/ui/shared";

type IconToggleSize = "sm" | "md";

const iconToggleSizeClass: Record<IconToggleSize, string> = {
	sm: "h-6 w-6",
	md: "h-7 w-7",
};

export function iconToggleButtonClass(selected: boolean, size: IconToggleSize = "md"): string {
	return cn(
		`inline-flex ${iconToggleSizeClass[size]} items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) disabled:cursor-not-allowed`,
		selected
			? "border-(--app-stroke) bg-(--app-fill-hover) text-(--app-link)"
			: "border-(--app-stroke) bg-(--app-surface-0) text-(--app-fg-muted) hover:bg-(--app-fill-hover) hover:text-(--app-link)",
	);
}
