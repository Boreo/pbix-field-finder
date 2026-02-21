// src/ui/features/results/components/BatchStatusSection.tsx
import type { BatchStatus } from "../workflow/types";

type BatchStatusSectionProps = {
	batchStatus: BatchStatus | null;
};

/**
 * Render aggregate success and failure counts for the last processing batch.
 * @param props Batch-status props containing the most recent batch summary.
 * @param props.batchStatus Most recent batch summary, or `null` before processing has run.
 * @returns A batch summary panel, or `null` when no batch status is available.
 */
export function BatchStatusSection({ batchStatus }: BatchStatusSectionProps) {
	if (!batchStatus) return null;

	return (
		<section data-testid="batch-status" className="space-y-1 px-1 text-[13px]" aria-live="polite">
			<p className="text-(--app-fg-secondary)">
				Processed {batchStatus.total} files: {batchStatus.successCount} succeeded,{" "}
				{batchStatus.failures.length} failed.
			</p>
			<div className="flex flex-wrap items-center gap-3">
				<span className="font-medium text-(--app-fg-success)">
					{batchStatus.successCount} succeeded
				</span>
				<span className="font-medium text-(--app-fg-danger)">
					{batchStatus.failures.length} failed
				</span>
			</div>
			{batchStatus.failures.length > 0 ? (
				<ul className="list-disc space-y-0.5 pl-4 text-(--app-fg-danger)">
					{batchStatus.failures.map((failure) => (
						<li key={`${failure.fileName}:${failure.message}`}>
							{failure.fileName}: {failure.message}
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}
