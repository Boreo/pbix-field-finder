// src/ui/primitives/ToggleGroup.tsx
import { type ReactNode } from "react";
import { cn } from "@/ui/shared";

type Variant = "tab" | "pill";

const trackClass: Record<Variant, string> = {
	tab: "inline-flex gap-0.5 rounded-md border border-(--app-stroke) bg-(--app-surface-0) p-0.5",
	pill: "z-0 inline-flex gap-0.5 rounded-t-md rounded-b-none border border-b-0 border-(--app-stroke-subtle) bg-(--app-surface-1) p-0.5 opacity-85",
};

const buttonBase: Record<Variant, string> = {
	tab: "px-3 py-1 text-xs font-medium rounded transition-colors",
	pill: "inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring) disabled:cursor-not-allowed",
};

const buttonActive: Record<Variant, string> = {
	tab: "bg-(--app-surface-1) text-(--app-link)",
	pill: "border-(--app-stroke) bg-(--app-fill-hover) text-(--app-link)",
};

const buttonInactive: Record<Variant, string> = {
	tab: "text-(--app-fg-secondary) hover:text-(--app-link)",
	pill: "border-transparent bg-transparent text-(--app-fg-muted) hover:border-(--app-stroke-subtle) hover:bg-(--app-fill-hover) hover:text-(--app-fg-secondary)",
};

export function getToggleButtonClass(variant: Variant, selected: boolean): string {
	return cn(buttonBase[variant], selected ? buttonActive[variant] : buttonInactive[variant]);
}

type ToggleGroupProps<T extends string> = {
	"aria-label": string;
	value: T;
	onChange: (value: T) => void;
	variant?: Variant;
	children: ReactNode;
};

export function ToggleGroup<T extends string>({
	"aria-label": ariaLabel,
	variant = "tab",
	children,
}: ToggleGroupProps<T>) {
	return (
		<div role="group" aria-label={ariaLabel} className={trackClass[variant]}>
			{children}
		</div>
	);
}

type ToggleButtonProps<T extends string> = {
	value: T;
	selected: boolean;
	onSelect: (value: T) => void;
	"aria-label"?: string;
	title?: string;
	variant?: Variant;
	children: ReactNode;
};

function ToggleButton<T extends string>({
	value,
	selected,
	onSelect,
	"aria-label": ariaLabel,
	title,
	variant = "tab",
	children,
}: ToggleButtonProps<T>) {
	return (
		<button
			type="button"
			onClick={() => onSelect(value)}
			aria-pressed={selected}
			aria-label={ariaLabel}
			title={title}
			className={getToggleButtonClass(variant, selected)}
		>
			{children}
		</button>
	);
}

ToggleGroup.Button = ToggleButton;
