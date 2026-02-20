// src/ui/hooks/useCopyFeedback.test.ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyFeedback } from "./useCopyFeedback";

describe("useCopyFeedback", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("adds feedback and auto-removes it after the configured duration", () => {
		const { result } = renderHook(() => useCopyFeedback(1000));

		act(() => {
			result.current.showCopyFeedback({ x: 10, y: 20 });
		});

		expect(result.current.copyFeedbacks).toHaveLength(1);
		expect(result.current.copyFeedbacks[0]).toMatchObject({
			x: 10,
			y: 20,
			message: "Copied to clipboard",
		});

		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(result.current.copyFeedbacks).toHaveLength(0);
	});

	it("supports custom messages and overlapping feedback lifetimes", () => {
		const { result } = renderHook(() => useCopyFeedback(1000));

		act(() => {
			result.current.showCopyFeedback({ x: 1, y: 2, message: "First copy" });
		});

		act(() => {
			vi.advanceTimersByTime(400);
			result.current.showCopyFeedback({ x: 3, y: 4, message: "Second copy" });
		});

		expect(result.current.copyFeedbacks).toHaveLength(2);
		expect(result.current.copyFeedbacks.map((item) => item.message)).toEqual(["First copy", "Second copy"]);

		act(() => {
			vi.advanceTimersByTime(601);
		});

		expect(result.current.copyFeedbacks).toHaveLength(1);
		expect(result.current.copyFeedbacks[0].message).toBe("Second copy");

		act(() => {
			vi.advanceTimersByTime(399);
		});

		expect(result.current.copyFeedbacks).toHaveLength(0);
	});

	it("shifts feedback left when near the right edge to avoid wrapping", () => {
		const originalInnerWidth = window.innerWidth;
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			writable: true,
			value: 220,
		});

		const { result } = renderHook(() => useCopyFeedback(1000));

		act(() => {
			result.current.showCopyFeedback({
				x: 210,
				y: 20,
				message: "A longer copy feedback message that should clamp left",
			});
		});

		expect(result.current.copyFeedbacks).toHaveLength(1);
		expect(result.current.copyFeedbacks[0].x).toBeLessThan(210);
		expect(result.current.copyFeedbacks[0].x).toBeGreaterThanOrEqual(0);

		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			writable: true,
			value: originalInnerWidth,
		});
	});
});
