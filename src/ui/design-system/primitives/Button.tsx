// src/ui/primitives/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/ui/shared";

const base = [
	"inline-flex items-center gap-2 rounded-md border",
	"px-3 py-2 text-sm font-medium",
	"transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)",
	"disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

const variants = {
	brand:
		"border-transparent bg-(--app-accent-blue) text-white font-semibold shadow-sm hover:bg-(--app-accent-blue-hover) active:bg-(--app-accent-blue-press)",
	cta: "border-transparent bg-(--app-cta-orange) text-(--app-cta-orange-text) font-semibold shadow-sm hover:bg-(--app-cta-orange-hover) active:bg-(--app-cta-orange-press)",
	primary:
		"border-transparent bg-(--app-accent-blue) text-white font-semibold shadow-sm hover:bg-(--app-accent-blue-hover) active:bg-(--app-accent-blue-press)",
	secondary:
		"border-(--app-stroke) bg-(--app-surface-0) text-(--app-fg-secondary) hover:border-(--app-accent-blue) hover:bg-(--app-fill-hover) hover:text-(--app-link)",
	danger:
		"border-(--app-stroke) bg-(--app-surface-0) text-(--app-fg-secondary) hover:border-ctp-red hover:bg-(--app-fill-press) hover:text-(--app-fg-danger)",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: keyof typeof variants;
	children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "secondary", className, children, ...rest }, ref) => (
		<button
			ref={ref}
			type="button"
			className={cn(base, variants[variant], className)}
			{...rest}
		>
			{children}
		</button>
	),
);

Button.displayName = "Button";
