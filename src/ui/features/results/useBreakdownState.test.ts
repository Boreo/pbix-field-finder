// src/ui/features/results/useBreakdownState.test.ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
	BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY,
	BREAKDOWN_SEARCH_STORAGE_KEY,
	BREAKDOWN_TAB_STORAGE_KEY,
} from "../preferences/persistenceKeys";
import { useBreakdownState } from "./useBreakdownState";

describe("useBreakdownState", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("persists tab selection", () => {
		const first = renderHook(() => useBreakdownState());
		expect(first.result.current.activeTab).toBe("pages");

		act(() => {
			first.result.current.setActiveTab("visuals");
		});
		expect(window.localStorage.getItem(BREAKDOWN_TAB_STORAGE_KEY)).toBe("visuals");

		first.unmount();

		const second = renderHook(() => useBreakdownState());
		expect(second.result.current.activeTab).toBe("visuals");
	});

	it("promotes and demotes query correctly when locking and unlocking", () => {
		const { result } = renderHook(() => useBreakdownState());

		act(() => {
			result.current.setQuery("map");
		});
		expect(result.current.searchLocked).toBe(false);
		expect(result.current.query).toBe("map");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY)).toBeNull();

		act(() => {
			result.current.toggleLock();
		});
		expect(result.current.searchLocked).toBe(true);
		expect(result.current.query).toBe("map");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY)).toBe("true");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY)).toBe("map");

		act(() => {
			result.current.setQuery("global");
		});
		expect(result.current.query).toBe("global");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY)).toBe("global");

		act(() => {
			result.current.toggleLock();
		});
		expect(result.current.searchLocked).toBe(false);
		expect(result.current.query).toBe("global");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY)).toBe("false");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY)).toBeNull();
	});

	it("clears global query without unlocking", () => {
		const { result } = renderHook(() => useBreakdownState());

		act(() => {
			result.current.setQuery("nomatch");
			result.current.toggleLock();
			result.current.clearGlobal();
		});

		expect(result.current.searchLocked).toBe(true);
		expect(result.current.query).toBe("");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_LOCKED_STORAGE_KEY)).toBe("true");
		expect(window.localStorage.getItem(BREAKDOWN_SEARCH_STORAGE_KEY)).toBeNull();
	});

	it("synchronizes lock and query changes across instances", async () => {
		const first = renderHook(() => useBreakdownState());
		const second = renderHook(() => useBreakdownState());

		act(() => {
			second.result.current.setQuery("sales");
		});
		act(() => {
			second.result.current.toggleLock();
		});

		await waitFor(() => {
			expect(first.result.current.searchLocked).toBe(true);
			expect(first.result.current.query).toBe("sales");
		});

		act(() => {
			second.result.current.setQuery("country");
		});

		await waitFor(() => {
			expect(first.result.current.query).toBe("country");
		});

		act(() => {
			second.result.current.toggleLock();
		});

		await waitFor(() => {
			expect(first.result.current.searchLocked).toBe(false);
			expect(first.result.current.query).toBe("country");
		});
	});
});
