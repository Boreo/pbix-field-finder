// src/app/components/AboutSection.tsx
import { ExternalLink, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import { cn, type ThemeMode } from "@/ui/shared";
import githubLogoBlack from "../../assets/icons/GitHub_Invertocat_Black.svg";
import githubLogoWhite from "../../assets/icons/GitHub_Invertocat_White.svg";

type AboutSectionProps = {
	isProminent: boolean;
	mode: ThemeMode;
};

type ExternalTextLinkProps = {
	href: string;
	children: ReactNode;
	startIcon?: ReactNode;
};

const links = {
	template: "https://github.com/stephbruno/Power-BI-Field-Finder",
	source: "https://github.com/boreo/pbix-field-finder",
	issues: "https://github.com/Boreo/pbix-field-finder/issues",
} as const;

const baseClassName =
	"mx-2 w-[calc(100%-16px)] max-w-[680px] rounded-md border px-3 py-2 text-left text-sm md:mx-auto";
const prominentClassName =
	"border-[color-mix(in_srgb,var(--app-accent-secondary)_32%,var(--app-stroke)_68%)] bg-[color-mix(in_srgb,var(--app-accent-secondary)_8%,var(--app-surface-1))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--app-accent-secondary)_18%,transparent)]";
const subtleClassName = "border-(--app-stroke) bg-(--app-surface-1)";
const bodyClassName = "space-y-2 text-sm text-(--app-fg-secondary)";
const leadClassName = "text-base leading-relaxed font-medium text-(--app-fg-primary)";
const paragraphClassName = "leading-relaxed";
const linksRowClassName = "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-(--app-stroke) pt-2 opacity-85";
const githubLogoClassName =
	"h-3.5 w-3.5 rounded-sm bg-(--app-surface-0) p-0.5";
const footerIconClassName = "h-3.5 w-3.5";
const subtleLinkClassName =
	"inline-flex items-center gap-1 text-(--app-fg-secondary) transition-colors hover:text-(--app-link)";

function ExternalTextLink({ href, children, startIcon }: ExternalTextLinkProps) {
	return (
		<a className={subtleLinkClassName} href={href} target="_blank" rel="noreferrer">
			{startIcon}
			{children}
			<ExternalLink aria-hidden="true" className={footerIconClassName} />
		</a>
	);
}

function getGitHubLogo(mode: ThemeMode) {
	return mode === "mocha" ? githubLogoWhite : githubLogoBlack;
}

/**
 * Render the static about panel with project and attribution links.
 * @param props About-section props controlling visual emphasis.
 * @param props.isProminent Indicates whether the section should render in highlighted styling.
 * @param props.mode Active application theme mode used for theme-aware assets.
 * @returns The about panel shown at the bottom of the application layout.
 */
export function AboutSection({ isProminent, mode }: AboutSectionProps) {
	return (
		<section
			data-testid="about-section"
			className={cn(baseClassName, isProminent ? prominentClassName : subtleClassName)}
			aria-label="About PBIX Field Finder"
		>
			<div className={bodyClassName}>
				<p className={leadClassName}>Runs fully in your browser.</p>
				<p className={paragraphClassName}>
					All processing happens on your device. Nothing is uploaded or sent to a server.
				</p>
				<p className={paragraphClassName}>
					Need deeper modelling context or “what’s not used”? Use the{" "}
					<ExternalTextLink href={links.template}>Field Finder template</ExternalTextLink>.
				</p>
				<div className={linksRowClassName}>
					<ExternalTextLink
						href={links.source}
						startIcon={
							<img src={getGitHubLogo(mode)} alt="" aria-hidden="true" className={githubLogoClassName} />
						}
					>
						View source
					</ExternalTextLink>
					<ExternalTextLink href={links.issues} startIcon={<ListTodo aria-hidden="true" className={footerIconClassName} />}>
						Issues &amp; feedback
					</ExternalTextLink>
				</div>
			</div>
		</section>
	);
}
