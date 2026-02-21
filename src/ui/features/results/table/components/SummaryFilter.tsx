// src/ui/features/results/components/SummaryFilter.tsx
import { CircleX, Search } from "lucide-react";
import type { RefObject } from "react";

type SummaryFilterProps = {
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	inputRef?: RefObject<HTMLInputElement | null>;
};

/**
 * Render the free-text filter input used by the summary table.
 * @param props Filter props containing current query text and update callback.
 * @param props.globalFilter Current filter string applied to summary rows.
 * @param props.onGlobalFilterChange Updates the filter string as the user types or clears.
 * @returns A search input with optional clear action.
 */
export function SummaryFilter({ globalFilter, onGlobalFilterChange, inputRef }: SummaryFilterProps) {
	return (
		<div className="group relative w-full min-w-0">
			<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--app-fg-muted) transition-colors group-focus-within:text-(--app-link)">
				<Search aria-hidden="true" className="h-4 w-4" />
			</span>
			<input
				ref={inputRef}
				type="search"
				value={globalFilter}
				onChange={(event) => onGlobalFilterChange(event.target.value)}
				placeholder="Filter by table, field, or kind"
				className="h-9 w-full rounded-md border border-(--app-stroke) bg-(--app-surface-0) py-0 pl-9 pr-10 text-sm text-(--app-fg-primary) placeholder:text-(--app-fg-muted) outline-none transition-colors focus:border-(--app-accent-blue) focus:placeholder:text-(--app-link)"
				aria-label="Filter summary table"
			/>
			{globalFilter ? (
				<button
					type="button"
					onClick={() => onGlobalFilterChange("")}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-(--app-fg-muted) transition-colors hover:text-(--app-link)"
					aria-label="Clear summary filter"
					title="Clear summary filter"
				>
					<CircleX aria-hidden="true" className="h-4 w-4" />
				</button>
			) : null}
		</div>
	);
}
