// src/ui/features/results/components/SummaryFilter.tsx
import { CircleX, Search } from "lucide-react";

type SummaryFilterProps = {
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
};

export function SummaryFilter({ globalFilter, onGlobalFilterChange }: SummaryFilterProps) {
	return (
		<div className="group relative w-full md:w-96">
			<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--app-fg-muted) transition-colors group-focus-within:text-(--app-fg-accent-text)">
				<Search aria-hidden="true" className="h-4 w-4" />
			</span>
			<input
				type="search"
				value={globalFilter}
				onChange={(event) => onGlobalFilterChange(event.target.value)}
				placeholder="Filter by table, field, or kind"
				className="h-9 w-full rounded-md border border-ctp-surface2 bg-ctp-surface0 py-0 pl-9 pr-10 text-sm text-(--app-fg-primary) placeholder:text-(--app-fg-muted) outline-none transition-colors focus:border-(--app-accent) focus:placeholder:text-(--app-fg-accent-text)"
				aria-label="Filter summary table"
			/>
			{globalFilter ? (
				<button
					type="button"
					onClick={() => onGlobalFilterChange("")}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-(--app-fg-muted) transition-colors hover:text-(--app-fg-accent-text)"
					aria-label="Clear summary filter"
					title="Clear summary filter"
				>
					<CircleX aria-hidden="true" className="h-4 w-4" />
				</button>
			) : null}
		</div>
	);
}
