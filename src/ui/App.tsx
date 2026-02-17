// src/ui/App.tsx
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProcessingStatus } from "./components/ProcessingStatus";
import { SkipLink } from "./components/SkipLink";
import { useExportActions } from "./features/export/useExportActions";
import { IngestSection } from "./features/ingest/components/IngestSection";
import { AppHeader } from "./features/preferences/components/AppHeader";
import { AUTO_WIDE_SUPPRESS_STORAGE_KEY } from "./features/preferences/persistenceKeys";
import { BatchStatusSection } from "./features/results/components/BatchStatusSection";
import { AboutSection } from "./features/results/components/AboutSection";
import { ResultsSection } from "./features/results/components/ResultsSection";
import { useProjectionViewModel } from "./features/results/useProjectionViewModel";
import { useResultsWorkflow } from "./features/results/useResultsWorkflow";
import { useTablePreferences } from "./hooks/useTablePreferences";
import { useTheme } from "./hooks/useTheme";
import { APP_ACCENT } from "./theme-config";
import type { AccentName } from "./types";

const NARROW_LAYOUT_MAX_WIDTH = "275mm";
const LAYOUT_TOGGLE_MEDIA_QUERY = `(min-width: calc(${NARROW_LAYOUT_MAX_WIDTH} + 3rem))`;

function getAccentStyles(accent: AccentName): CSSProperties {
	return {
		"--app-accent": `var(--color-ctp-${accent})`,
	} as CSSProperties;
}

function canShowLayoutWidthToggle() {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
		return true;
	}
	return window.matchMedia(LAYOUT_TOGGLE_MEDIA_QUERY).matches;
}

function getStoredAutoWideSuppress(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return window.localStorage.getItem(AUTO_WIDE_SUPPRESS_STORAGE_KEY) === "true";
}

/**
 * Render the root application shell and wire file-processing workflows to UI sections.
 * @returns The full PBIX Field Finder application layout for the browser DOM.
 */
export function App() {
	const { mode, toggleMode } = useTheme();
	const { density, setDensity, layoutWidthMode, setLayoutWidthMode } = useTablePreferences();
	const [summaryFilter, setSummaryFilter] = useState("");
	const [showLayoutWidthToggle, setShowLayoutWidthToggle] = useState(() => canShowLayoutWidthToggle());
	// Auto-wide: when the viewport crosses the breakpoint for the first time, switch to "fill".
	// suppressAutoWide (persisted) stops this once the user manually toggles back to narrow.
	// hasAutoSwitchedToWide (session-only) tracks whether the auto-switch fired this session.
	const [suppressAutoWide, setSuppressAutoWide] = useState(() => getStoredAutoWideSuppress());
	const [hasAutoSwitchedToWide, setHasAutoSwitchedToWide] = useState(false);
	const lastWideCapableRef = useRef<boolean | null>(null);

	const {
		status,
		latestResult,
		latestDatasetLabel,
		batchStatus,
		validationMessage,
		loadedFiles,
		isProcessing,
		onFilesAccepted,
		onRemoveFile,
		onClearFiles,
		onToggleFileVisibility,
		setValidationMessage,
	} = useResultsWorkflow();

	const { canonicalUsages, summaryRows, filteredNormalised, singleReportMode, exportScopeLabel, exportDisabled } =
		useProjectionViewModel({
			latestResult,
			latestDatasetLabel,
			isProcessing,
			loadedFiles,
		});

	const { onCopyRawCsv, onExportSummaryJson, onExportRawCsv, onExportDetailsJson } = useExportActions({
		summaryRows,
		normalisedRows: filteredNormalised,
		exportScopeLabel,
	});

	const onToggleLayoutWidth = useCallback(() => {
		setLayoutWidthMode((current) => {
			const next = current === "fill" ? "narrow" : "fill";
			if (next === "narrow" && hasAutoSwitchedToWide && !suppressAutoWide) {
				setSuppressAutoWide(true);
			}
			return next;
		});
	}, [hasAutoSwitchedToWide, setLayoutWidthMode, suppressAutoWide]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		window.localStorage.setItem(AUTO_WIDE_SUPPRESS_STORAGE_KEY, suppressAutoWide ? "true" : "false");
	}, [suppressAutoWide]);

	useEffect(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
			return;
		}

		const mediaQuery = window.matchMedia(LAYOUT_TOGGLE_MEDIA_QUERY);
		const syncVisibility = (isWideCapable: boolean) => {
			setShowLayoutWidthToggle(isWideCapable);
			const crossedIntoWide = lastWideCapableRef.current === false && isWideCapable;
			lastWideCapableRef.current = isWideCapable;
			if (crossedIntoWide && layoutWidthMode === "narrow" && !suppressAutoWide) {
				setLayoutWidthMode("fill");
				setHasAutoSwitchedToWide(true);
			}
		};

		syncVisibility(mediaQuery.matches);

		const onChange = (event: MediaQueryListEvent) => syncVisibility(event.matches);
		mediaQuery.addEventListener("change", onChange);
		return () => mediaQuery.removeEventListener("change", onChange);
	}, [layoutWidthMode, setLayoutWidthMode, suppressAutoWide]);

	return (
		<div className={`pbix-app ${mode}`} style={getAccentStyles(APP_ACCENT)}>
			<SkipLink />
			<div
				className={`mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-6 md:px-6 ${
					layoutWidthMode === "narrow" ? "max-w-[275mm]" : "max-w-none"
				}`}
			>
				{/* Section: Header controls */}
				<AppHeader
					mode={mode}
					onToggleTheme={toggleMode}
					layoutWidthMode={layoutWidthMode}
					onToggleLayoutWidth={onToggleLayoutWidth}
					showLayoutWidthToggle={showLayoutWidthToggle}
				/>

				{/* Section: File ingestion */}
				<IngestSection
					loadedFiles={loadedFiles}
					isProcessing={isProcessing}
					validationMessage={validationMessage}
					onFilesAccepted={onFilesAccepted}
					onRemoveFile={onRemoveFile}
					onClearFiles={onClearFiles}
					onToggleFileVisibility={onToggleFileVisibility}
					onValidationError={setValidationMessage}
				/>

				{/* Section: Processing status */}
				<ProcessingStatus
					status={status}
					fileCount={loadedFiles.length}
					fieldCount={summaryRows.length}
					tableCount={new Set(summaryRows.map((r) => r.table)).size}
					failureCount={batchStatus?.failures.length ?? 0}
				/>

				{/* Section: Results */}
				<ResultsSection
					latestResult={latestResult}
					exportDisabled={exportDisabled}
					density={density}
					setDensity={setDensity}
					summaryRows={summaryRows}
					canonicalUsages={canonicalUsages}
					singleReportMode={singleReportMode}
					globalFilter={summaryFilter}
					onGlobalFilterChange={setSummaryFilter}
					onCopyRawCsv={onCopyRawCsv}
					onExportSummaryJson={onExportSummaryJson}
					onExportRawCsv={onExportRawCsv}
					onExportDetailsJson={onExportDetailsJson}
				/>

				{/* Section: Batch summary */}
				<BatchStatusSection batchStatus={batchStatus} />
				{/* Section: About */}
				<AboutSection isProminent={loadedFiles.length === 0} mode={mode} />
			</div>
		</div>
	);
}
