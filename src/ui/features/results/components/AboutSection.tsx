// src/ui/features/results/components/AboutSection.tsx
import { ExternalLink } from "lucide-react";

type AboutSectionProps = {
	isProminent: boolean;
};

const baseClassName =
	"mx-2 w-[calc(100%-16px)] max-w-[680px] rounded-md border px-3 py-2 text-left text-sm md:mx-auto";
const prominentClassName =
	"border-(--app-accent) bg-[color-mix(in_srgb,var(--app-accent)_16%,var(--color-ctp-mantle))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--app-accent)_32%,transparent)]";
const subtleClassName = "border-ctp-surface2 bg-ctp-mantle";
const linkClassName =
	"inline-flex items-center gap-1 text-(--app-fg-info) transition-colors hover:text-(--app-fg-accent-text)";

/**
 * Render the static about panel with project and attribution links.
 * @param props About-section props controlling visual emphasis.
 * @param props.isProminent Indicates whether the section should render in highlighted styling.
 * @returns The about panel shown at the bottom of the application layout.
 */
export function AboutSection({ isProminent }: AboutSectionProps) {
	return (
		<section
			data-testid="about-section"
			className={`${baseClassName} ${isProminent ? prominentClassName : subtleClassName}`}
			aria-label="About PBIX Field Finder"
		>
			<p className="text-(--app-fg-secondary)">Fast field-usage lookup for Power BI reports.</p>
			<p className="mt-1 text-(--app-fg-secondary)">
				Runs in-browser with no uploads, so your files stay on your machine.
			</p>
			<p className="mt-1 text-(--app-fg-secondary)">
				<a
					className={linkClassName}
					href="https://github.com/boreo/pbix-field-finder"
					target="_blank"
					rel="noreferrer"
				>
					Source on GitHub
					<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
				</a>{" "}
				&middot; Thanks to the{" "}
				<a
					className={linkClassName}
					href="https://github.com/stephbruno/Power-BI-Field-Finder"
					target="_blank"
					rel="noreferrer"
				>
					Power-BI-Field-Finder template
					<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
				</a>
			</p>
		</section>
	);
}
