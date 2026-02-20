// src/ui/components/CopyFeedbackOverlay.tsx
import type { CopyFeedbackItem } from "../hooks/useCopyFeedback";

type CopyFeedbackOverlayProps = {
	feedbacks: CopyFeedbackItem[];
};

/**
 * Render transient copy-feedback notifications above the app UI.
 * @param props Overlay props with active feedback items to render.
 * @param props.feedbacks Active copy-feedback items with coordinates and message text.
 * @returns A fixed-position overlay containing animated copy feedback toasts.
 */
export function CopyFeedbackOverlay({ feedbacks }: CopyFeedbackOverlayProps) {
	return (
		<div className="pointer-events-none fixed inset-0 z-150">
			{feedbacks.map((feedback) => (
				<div
					key={feedback.id}
					className="pbix-copy-feedback pointer-events-none fixed rounded border border-ctp-surface2 bg-ctp-surface0 px-2 py-1 text-xs font-semibold whitespace-nowrap text-(--app-fg-primary) shadow-md"
					style={{
						left: `${feedback.x + 8}px`,
						top: `${feedback.y - 12}px`,
					}}
				>
					{feedback.message}
				</div>
			))}
		</div>
	);
}
