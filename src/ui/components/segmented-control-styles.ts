// src/ui/components/segmented-control-styles.ts
// Shared Tailwind class strings so segmented controls look consistent.
export const SEGMENTED_TRACK_CLASS =
	"segmented-soft-pill-track relative isolate inline-flex overflow-hidden rounded-full border border-ctp-surface2 bg-[color-mix(in_srgb,var(--color-ctp-surface0)_84%,var(--color-ctp-mantle))] p-1 shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-ctp-overlay0)_26%,transparent)]";

export const SEGMENTED_ACTIVE_PIP_CLASS =
	"segmented-soft-pill-pip pointer-events-none absolute bottom-1 left-0 top-1 rounded-full border border-[color-mix(in_srgb,var(--app-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--app-accent)_18%,var(--color-ctp-surface0))] shadow-[0_1px_2px_0_color-mix(in_srgb,var(--color-ctp-overlay0)_24%,transparent)] transition-[transform,width,opacity] duration-200 ease-out";

const SEGMENTED_OPTION_BASE_CLASS =
	"segmented-soft-pill-option relative z-10 rounded-full px-3 py-1 text-xs font-medium transition-colors";

const SEGMENTED_OPTION_ACTIVE_CLASS =
	"text-[var(--app-fg-accent-text)]";

const SEGMENTED_OPTION_INACTIVE_CLASS =
	"text-[var(--app-fg-secondary)] hover:bg-[color-mix(in_srgb,var(--app-accent)_10%,var(--color-ctp-surface0))] hover:text-[var(--app-fg-accent-text)]";

export function getSegmentedOptionClass(active: boolean): string {
	return `${SEGMENTED_OPTION_BASE_CLASS} ${
		active ? SEGMENTED_OPTION_ACTIVE_CLASS : SEGMENTED_OPTION_INACTIVE_CLASS
	}`;
}
