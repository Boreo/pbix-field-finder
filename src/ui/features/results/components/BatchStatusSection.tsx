// src/ui/features/results/components/BatchStatusSection.tsx
import type { BatchStatus } from "../workflow.types";

type BatchStatusSectionProps = {
	batchStatus: BatchStatus | null;
};

export function BatchStatusSection({ batchStatus }: BatchStatusSectionProps) {
	if (!batchStatus) return null;

	return (
		<section
			data-testid="batch-status"
			className="mt-auto rounded-md border border-ctp-surface2 bg-ctp-mantle px-3 py-2 text-xs"
			aria-live="polite"
		>
			<p className="text-(--app-fg-secondary)">
				Processed {batchStatus.total} files: {batchStatus.successCount} succeeded,{" "}
				{batchStatus.failures.length} failed.
			</p>
			<div className="mt-1 flex flex-wrap items-center gap-1.5">
				<span className="inline-flex rounded border border-[color-mix(in_srgb,var(--color-ctp-green)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-ctp-green)_22%,transparent)] px-2 py-0.5 font-medium text-(--app-fg-success)">
					{batchStatus.successCount} succeeded
				</span>
				<span className="inline-flex rounded border border-[color-mix(in_srgb,var(--color-ctp-red)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-ctp-red)_22%,transparent)] px-2 py-0.5 font-medium text-(--app-fg-danger)">
					{batchStatus.failures.length} failed
				</span>
			</div>
			{batchStatus.failures.length > 0 ? (
				<ul className="mt-1 list-disc space-y-0.5 pl-4 text-(--app-fg-danger)">
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
