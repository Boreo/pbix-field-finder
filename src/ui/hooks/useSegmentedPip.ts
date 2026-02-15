// src/ui/hooks/useSegmentedPip.ts
// Measures DOM rects to position an animated indicator pip.
// isPipReady stays false until the first measurement so the pip doesn't flash at 0,0.
import { useCallback, useEffect, useRef, useState } from "react";

type SegmentedPipState = {
	left: number;
	width: number;
};

export function useSegmentedPip<T extends string>(activeKey: T) {
	const trackRef = useRef<HTMLDivElement | null>(null);
	const optionRefs = useRef<Partial<Record<T, HTMLElement | null>>>({});
	const [pipStyle, setPipStyle] = useState<SegmentedPipState>({ left: 0, width: 0 });
	const [isPipReady, setIsPipReady] = useState(false);

	const setOptionRef = useCallback(
		(key: T) =>
			(element: HTMLElement | null): void => {
				optionRefs.current[key] = element;
			},
		[],
	);

	const syncPip = useCallback(() => {
		const track = trackRef.current;
		const activeOption = optionRefs.current[activeKey];
		if (!track || !activeOption) return;

		const trackRect = track.getBoundingClientRect();
		const optionRect = activeOption.getBoundingClientRect();
		const left = optionRect.left - trackRect.left;
		const width = optionRect.width;

		setPipStyle((current) =>
			current.left === left && current.width === width ? current : { left, width },
		);
		setIsPipReady(true);
	}, [activeKey]);

	useEffect(() => {
		window.addEventListener("resize", syncPip);
		return () => window.removeEventListener("resize", syncPip);
	}, [syncPip]);

	return {
		trackRef,
		setOptionRef,
		syncPip,
		pipStyle,
		isPipReady,
	};
}
