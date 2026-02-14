// src/ui/primitives/Panel.tsx
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const base = "rounded-xl border border-(--app-border) bg-ctp-crust p-3";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
	as?: "div" | "section";
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
	({ as: Tag = "div", className, children, ...rest }, ref) => (
		<Tag ref={ref} className={cn(base, className)} {...rest}>
			{children}
		</Tag>
	),
);

Panel.displayName = "Panel";
