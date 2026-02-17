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
			setCopyFeedbacks((current) => [...current, { id: nextId, x, y, message }]);
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
