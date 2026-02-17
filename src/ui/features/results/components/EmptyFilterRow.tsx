// src/ui/features/results/components/EmptyFilterRow.tsx

type EmptyFilterRowProps = {
	colSpan: number;
	borderClass: string;
	paddingClass: string;
	hasFilterNoMatches: boolean;
	filterMessage: string;
	onClearFilter: () => void;
	fallbackMessage: string;
	/** Optional extra classes on the wrapping <tr>. */
	rowClassName?: string;
	/** Optional extra classes on the <td> (e.g. muted text colour). */
	cellClassName?: string;
};

export function EmptyFilterRow({
	colSpan,
	borderClass,
	paddingClass,
	hasFilterNoMatches,
	filterMessage,
	onClearFilter,
	fallbackMessage,
	rowClassName,
	cellClassName,
}: EmptyFilterRowProps) {
	return (
		<tr className={rowClassName}>
			<td colSpan={colSpan} className={`border ${borderClass} ${paddingClass} text-center ${cellClassName ?? ""}`}>
				{hasFilterNoMatches ? (
					<div className="flex flex-col items-center gap-1">
						<span>{filterMessage}</span>
						<button
							type="button"
							onClick={onClearFilter}
							className="text-(--app-fg-accent-text) underline underline-offset-2 hover:text-(--app-fg-primary)"
						>
							Clear filter
						</button>
					</div>
				) : (
					fallbackMessage
				)}
			</td>
		</tr>
	);
}
