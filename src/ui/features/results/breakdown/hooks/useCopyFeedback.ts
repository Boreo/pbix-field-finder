// src/ui/hooks/useCopyFeedback.ts
import { useCallback, useEffect, useRef, useState } from "react";

export type CopyFeedbackItem = {
	id: number;
	x: number;
	y: number;
	message: string;
};

type ShowCopyFeedbackParams = {
	x: number;
	y: number;
	message?: string;
};

const HORIZONTAL_OFFSET_PX = 8;
const VIEWPORT_PADDING_PX = 8;
const ESTIMATED_CHAR_WIDTH_PX = 7;
const ESTIMATED_HORIZONTAL_CHROME_PX = 20;

function estimateFeedbackWidth(message: string): number {
	if (typeof document === "undefined") {
		return message.length * ESTIMATED_CHAR_WIDTH_PX + ESTIMATED_HORIZONTAL_CHROME_PX;
	}

	const probe = document.createElement("div");
	probe.className =
		"pbix-copy-feedback fixed rounded border border-(--app-stroke) bg-(--app-surface-0) px-2 py-1 text-xs font-semibold whitespace-nowrap";
	probe.style.position = "fixed";
	probe.style.left = "-9999px";
	probe.style.top = "-9999px";
	probe.style.visibility = "hidden";
	probe.style.pointerEvents = "none";
	probe.textContent = message;
	document.body.appendChild(probe);

	const measuredWidth = probe.getBoundingClientRect().width;
	document.body.removeChild(probe);

	if (measuredWidth > 0) {
		return measuredWidth;
	}

	return message.length * ESTIMATED_CHAR_WIDTH_PX + ESTIMATED_HORIZONTAL_CHROME_PX;
}

function clampFeedbackX(x: number, message: string): number {
	if (typeof window === "undefined") {
		return x;
	}

	const viewportWidth = window.innerWidth;
	if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
		return x;
	}

	const feedbackWidth = estimateFeedbackWidth(message);
	const maxLeft = viewportWidth - feedbackWidth - VIEWPORT_PADDING_PX;
	const maxX = maxLeft - HORIZONTAL_OFFSET_PX;
	const minX = VIEWPORT_PADDING_PX - HORIZONTAL_OFFSET_PX;
	return Math.max(minX, Math.min(x, maxX));
}

/**
 * Manage transient copy-feedback notifications anchored to viewport coordinates.
 * @param durationMs Time in milliseconds each feedback item remains visible before auto-dismiss.
 * @returns Active feedback items plus a function to show new feedback at a cursor/location point.
 */
export function useCopyFeedback(durationMs = 1500) {
	const [copyFeedbacks, setCopyFeedbacks] = useState<CopyFeedbackItem[]>([]);
	const copyFeedbackIdRef = useRef(0);
	const copyFeedbackTimeoutsRef = useRef(new Map<number, number>());

	const removeCopyFeedback = useCallback((feedbackId: number) => {
		setCopyFeedbacks((current) => current.filter((feedback) => feedback.id !== feedbackId));
		const timeoutId = copyFeedbackTimeoutsRef.current.get(feedbackId);
		if (timeoutId !== undefined) {
			window.clearTimeout(timeoutId);
			copyFeedbackTimeoutsRef.current.delete(feedbackId);
		}
	}, []);

	const showCopyFeedback = useCallback(
		({ x, y, message = "Copied to clipboard" }: ShowCopyFeedbackParams) => {
			const nextId = copyFeedbackIdRef.current + 1;
			copyFeedbackIdRef.current = nextId;
			const clampedX = clampFeedbackX(x, message);
			setCopyFeedbacks((current) => [...current, { id: nextId, x: clampedX, y, message }]);
			const timeoutId = window.setTimeout(() => removeCopyFeedback(nextId), durationMs);
			copyFeedbackTimeoutsRef.current.set(nextId, timeoutId);
		},
		[durationMs, removeCopyFeedback],
	);

	useEffect(() => {
		return () => {
			for (const timeoutId of copyFeedbackTimeoutsRef.current.values()) {
				window.clearTimeout(timeoutId);
			}
			copyFeedbackTimeoutsRef.current.clear();
		};
	}, []);

	return {
		copyFeedbacks,
		showCopyFeedback,
	};
}
