// src/ui/primitives/Chip.tsx
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/ui/shared";

const base = [
	"inline-flex max-w-full items-center gap-1",
	"rounded-md border border-(--app-stroke) bg-(--app-surface-0)",
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
