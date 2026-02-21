// src/ui/features/results/useBreakdownState.ts
import { useCallback, useEffect, useState } from "react";
import {
	BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY,
	BREAKDOWN_SEARCH_STORAGE_KEY,
	BREAKDOWN_TAB_STORAGE_KEY,
} from "../storage/keys";

export type TabKey = "pages" | "visuals";

const BREAKDOWN_SEARCH_CHANGE_EVENT = "breakdown-search-change";
type BreakdownSearchChangeDetail = { locked: boolean; query: string };

let hasInitializedBreakdownSearch = false;

function initializeBreakdownSearchScope() {
	if (typeof window === "undefined" || hasInitializedBreakdownSearch) return;
	hasInitializedBreakdownSearch = true;
	window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "false");
	window.localStorage.removeItem(BREAKDOWN_SEARCH_STORAGE_KEY);
}

function dispatchBreakdownSearchChange(detail: BreakdownSearchChangeDetail) {
	window.dispatchEvent(new CustomEvent<BreakdownSearchChangeDetail>(BREAKDOWN_SEARCH_CHANGE_EVENT, { detail }));
}

function getStoredTab(): TabKey {
	if (typeof window === "undefined") return "pages";
	const stored = window.localStorage.getItem(BREAKDOWN_TAB_STORAGE_KEY);
	return stored === "visuals" ? "visuals" : "pages";
}

function getStoredSearch(): string {
	if (typeof window === "undefined") return "";
	initializeBreakdownSearchScope();
	return window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY) ?? "";
}

function getStoredSearchLocked(): boolean {
	if (typeof window === "undefined") return false;
	initializeBreakdownSearchScope();
	return window.localStorage.getItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY) === "true";
}

/**
 * Manage breakdown tab selection and local/global search scope state.
 * Persists state to localStorage and synchronizes lock/query changes across mounted instances.
 */
export function useBreakdownState() {
	const [activeTab, setActiveTab] = useState<TabKey>(() => getStoredTab());
	const [searchLocked, setSearchLocked] = useState(() => getStoredSearchLocked());
	const [localSearchQuery, setLocalSearchQuery] = useState("");
	const [globalSearchQuery, setGlobalSearchQuery] = useState(() => getStoredSearch());
	const query = searchLocked ? globalSearchQuery : localSearchQuery;

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(BREAKDOWN_TAB_STORAGE_KEY, activeTab);
		}
	}, [activeTab]);

	useEffect(() => {
		const handleSearchChange = (event: Event) => {
			const customEvent = event as CustomEvent<BreakdownSearchChangeDetail>;
			const detail = customEvent.detail;
			const isLocked = detail?.locked ?? window.localStorage.getItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY) === "true";
			const newQuery = detail?.query ?? (window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY) ?? "");
			setSearchLocked(isLocked);
			if (isLocked) {
				setGlobalSearchQuery(newQuery);
			} else {
				setGlobalSearchQuery("");
				setLocalSearchQuery(newQuery);
			}
		};

		window.addEventListener(BREAKDOWN_SEARCH_CHANGE_EVENT, handleSearchChange);
		return () => window.removeEventListener(BREAKDOWN_SEARCH_CHANGE_EVENT, handleSearchChange);
	}, []);

	const setQuery = useCallback(
		(newQuery: string) => {
			if (searchLocked) {
				if (typeof window === "undefined") return;
				setGlobalSearchQuery(newQuery);
				window.localStorage.setItem(BREAKDOWN_SEARCH_STORAGE_KEY, newQuery);
				dispatchBreakdownSearchChange({ locked: true, query: newQuery });
				return;
			}
			setLocalSearchQuery(newQuery);
		},
		[searchLocked],
	);

	const toggleLock = useCallback(() => {
		if (typeof window === "undefined") return;
		if (searchLocked) {
			const queryToKeep = globalSearchQuery;
			setSearchLocked(false);
			setGlobalSearchQuery("");
			setLocalSearchQuery(queryToKeep);
			window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "false");
			window.localStorage.removeItem(BREAKDOWN_SEARCH_STORAGE_KEY);
			dispatchBreakdownSearchChange({ locked: false, query: queryToKeep });
			return;
		}

		const promotedQuery = localSearchQuery;
		setSearchLocked(true);
		setGlobalSearchQuery(promotedQuery);
		window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "true");
		window.localStorage.setItem(BREAKDOWN_SEARCH_STORAGE_KEY, promotedQuery);
		dispatchBreakdownSearchChange({ locked: true, query: promotedQuery });
	}, [searchLocked, localSearchQuery, globalSearchQuery]);

	const clearGlobal = useCallback(() => {
		if (typeof window === "undefined") return;
		setGlobalSearchQuery("");
		window.localStorage.setItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY, "true");
		window.localStorage.removeItem(BREAKDOWN_SEARCH_STORAGE_KEY);
		dispatchBreakdownSearchChange({ locked: true, query: "" });
	}, []);

	return {
		activeTab,
		setActiveTab,
		searchLocked,
		query,
		setQuery,
		toggleLock,
		clearGlobal,
		queryPlaceholder: searchLocked ? "Global filter..." : "Filter this breakdown...",
		queryAriaLabel: searchLocked ? "Global filter" : "Filter this breakdown",
	};
}
