// src/ui/primitives/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

const base = [
	"inline-flex items-center gap-2 rounded-md border",
	"px-3 py-2 text-sm font-medium",
	"transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-focus-ring)",
	"disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

const variants = {
	primary:
		"border-transparent bg-(--app-cta) text-(--app-cta-text) font-semibold shadow-sm hover:brightness-110",
	secondary:
		"border-(--app-border) bg-ctp-crust text-(--app-fg-secondary) hover:border-(--app-accent) hover:text-(--app-fg-accent-text)",
	danger:
		"border-(--app-border) bg-ctp-crust text-(--app-fg-secondary) hover:border-ctp-red hover:text-(--app-fg-danger)",
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
