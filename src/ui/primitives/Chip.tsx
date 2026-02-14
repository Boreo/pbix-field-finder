// src/ui/primitives/Chip.tsx
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const base = [
	"inline-flex max-w-full items-center gap-1",
	"rounded-md border border-(--app-border) bg-ctp-crust",
	"px-2 py-1 text-xs text-(--app-fg-secondary)",
].join(" ");

type ChipProps = HTMLAttributes<HTMLSpanElement>;

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
	({ className, children, ...rest }, ref) => (
		<span ref={ref} className={cn(base, className)} {...rest}>
			{children}
		</span>
	),
);

Chip.displayName = "Chip";
