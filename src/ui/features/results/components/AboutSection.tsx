// src/ui/features/results/components/AboutSection.tsx
import { ExternalLink, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import { Chip } from "../../../primitives/Chip";
import type { ThemeMode } from "../../../types";
import catppuccinLogo from "../../../../assets/icons/catppuccin.png";
import githubLogoBlack from "../../../../assets/icons/GitHub_Invertocat_Black.svg";
import githubLogoWhite from "../../../../assets/icons/GitHub_Invertocat_White.svg";

type AboutSectionProps = {
	isProminent: boolean;
	mode: ThemeMode;
};

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

type ExternalTextLinkProps = {
	href: string;
	children: ReactNode;
	startIcon?: ReactNode;
};

function ExternalTextLink({ href, children, startIcon }: ExternalTextLinkProps) {
	return (
		<a className={subtleLinkClassName} href={href} target="_blank" rel="noreferrer">
			{startIcon}
			{children}
			<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
		</a>
	);
}

/**
 * Render the static about panel with project and attribution links.
 * @param props About-section props controlling visual emphasis.
 * @param props.isProminent Indicates whether the section should render in highlighted styling.
 * @param props.mode Active application theme mode used for theme-aware assets.
 * @returns The about panel shown at the bottom of the application layout.
 */
export function AboutSection({ isProminent, mode }: AboutSectionProps) {
	const githubLogoSrc = mode === "mocha" ? githubLogoWhite : githubLogoBlack;

	return (
		<section
			data-testid="about-section"
			className={`${baseClassName} ${isProminent ? prominentClassName : subtleClassName}`}
			aria-label="About PBIX Field Finder"
		>
			<div className={bodyClassName}>
				<p className={leadClassName}>Runs fully in your browser.</p>
				<p className={paragraphClassName}>
					Need data modelling context? Use the{" "}
					<a
						className={subtleLinkClassName}
						href="https://github.com/stephbruno/Power-BI-Field-Finder"
						target="_blank"
						rel="noreferrer"
					>
						Field Finder template
						<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
					</a>
					.
				</p>
				<div className={guaranteeRowClassName} aria-label="Privacy guarantees">
					<Chip className={guaranteeChipClassName}>Local processing</Chip>
					<Chip className={guaranteeChipClassName}>No uploads</Chip>
					<Chip className={guaranteeChipClassName}>Runs locally</Chip>
				</div>
				<p className={linksRowClassName}>
					<ExternalTextLink
						href="https://github.com/boreo/pbix-field-finder"
						startIcon={
							<img
								src={githubLogoSrc}
								alt=""
								aria-hidden="true"
								className={githubLogoClassName}
							/>
						}
					>
						View source
					</ExternalTextLink>
					<ExternalTextLink
						href="https://github.com/Boreo/pbix-field-finder/issues"
						startIcon={<ListTodo aria-hidden="true" className={footerIconClassName} />}
					>
						Issues &amp; feedback
					</ExternalTextLink>
					<ExternalTextLink
						href="https://github.com/catppuccin"
						startIcon={<img src={catppuccinLogo} alt="" aria-hidden="true" className={catppuccinLogoClassName} />}
					>
						Theme: Catppuccin (contrast-adjusted).
					</ExternalTextLink>
				</p>
			</div>
		</section>
	);
}
