// src/ui/components/AboutSection.tsx
import { ExternalLink, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import catppuccinLogo from "../../assets/icons/catppuccin.png";
import githubLogoBlack from "../../assets/icons/GitHub_Invertocat_Black.svg";
import githubLogoWhite from "../../assets/icons/GitHub_Invertocat_White.svg";
import { cn } from "../lib/cn";
import { Chip } from "../primitives";
import type { ThemeMode } from "../types";

type AboutSectionProps = {
	isProminent: boolean;
	mode: ThemeMode;
};

type ExternalTextLinkProps = {
	href: string;
	children: ReactNode;
	startIcon?: ReactNode;
};

const privacyGuarantees = ["Local processing", "No uploads", "Runs locally"] as const;

const links = {
	template: "https://github.com/stephbruno/Power-BI-Field-Finder",
	source: "https://github.com/boreo/pbix-field-finder",
	issues: "https://github.com/Boreo/pbix-field-finder/issues",
	catppuccin: "https://github.com/catppuccin",
} as const;

const baseClassName =
	"mx-2 w-[calc(100%-16px)] max-w-[680px] rounded-md border px-3 py-2 text-left text-sm md:mx-auto";
const prominentClassName =
	"border-(--app-accent) bg-[color-mix(in_srgb,var(--app-accent)_16%,var(--color-ctp-mantle))] shadow-[0_0_0_1px_color-mix(in_srgb,var(--app-accent)_32%,transparent)]";
const subtleClassName = "border-ctp-surface2 bg-ctp-mantle";
const bodyClassName = "space-y-2 text-sm text-(--app-fg-secondary)";
const leadClassName = "text-base leading-relaxed font-medium text-(--app-fg-primary)";
const paragraphClassName = "leading-relaxed";
const guaranteeRowClassName = "flex flex-wrap items-center gap-1.5";
const guaranteeChipClassName =
	"rounded-sm border-ctp-surface2 bg-[color-mix(in_srgb,var(--color-ctp-surface0)_58%,transparent)] px-1.5 py-0.5 text-xs text-(--app-fg-secondary)";
const linksRowClassName = "flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ctp-surface2 pt-2 opacity-85";
const githubLogoClassName =
	"h-3.5 w-3.5 rounded-sm bg-[color-mix(in_srgb,var(--color-ctp-base)_82%,transparent)] p-0.5";
const footerIconClassName = "h-3.5 w-3.5";
const catppuccinLogoClassName = "h-3.5 w-3.5 rounded-sm";
const subtleLinkClassName =
	"inline-flex items-center gap-1 text-(--app-fg-secondary) transition-colors hover:text-(--app-fg-info)";

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
					Need data modelling context? Use the{" "}
					<ExternalTextLink href={links.template}>Field Finder template</ExternalTextLink>.
				</p>
				<div className={guaranteeRowClassName} aria-label="Privacy guarantees">
					{privacyGuarantees.map((guarantee) => (
						<Chip key={guarantee} className={guaranteeChipClassName}>
							{guarantee}
						</Chip>
					))}
				</div>
				<p className={linksRowClassName}>
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
					<ExternalTextLink
						href={links.catppuccin}
						startIcon={<img src={catppuccinLogo} alt="" aria-hidden="true" className={catppuccinLogoClassName} />}
					>
						Theme: Catppuccin (contrast-adjusted).
					</ExternalTextLink>
				</p>
			</div>
		</section>
	);
}
