// src/ui/primitives/IconButton.tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const base = [
	"inline-flex items-center justify-center rounded-md",
	"transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)",
	"disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

const variants = {
	ghost: "text-(--app-fg-secondary) hover:text-(--app-fg-accent-text)",
	danger: "text-(--app-fg-secondary) hover:text-(--app-fg-danger)",
} as const;

const sizes = {
	sm: "h-6 w-6", // 24px - meets WCAG 2.5.8 AA minimum touch target
	md: "p-1.5",
} as const;

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: keyof typeof variants;
	size?: keyof typeof sizes;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
	({ variant = "ghost", size = "md", className, ...rest }, ref) => (
		<button
			ref={ref}
			type="button"
			className={cn(base, variants[variant], sizes[size], className)}
			{...rest}
		/>
	),
);

IconButton.displayName = "IconButton";
