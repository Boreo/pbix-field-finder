// src/ui/features/results/components/ReportBreakdown.tsx
import { Fragment } from "react";
import { Minus, Plus } from "lucide-react";
import type { SummaryRow } from "../../../../core/projections";

type ReportBreakdownProps = {
	summaryRow: SummaryRow;
	singleReportMode: boolean;
	gridBorderClass: string;
	onToggleReport: (reportKey: string) => void;
	isReportExpanded: (reportKey: string) => boolean;
};

function zebraRowClass(index: number) {
	return index % 2 === 0 ? "bg-[var(--app-zebra-row-first)]" : "bg-[var(--app-zebra-row-second)]";
}

export function ReportBreakdown({
	summaryRow,
	singleReportMode,
	gridBorderClass,
	onToggleReport,
	isReportExpanded,
}: ReportBreakdownProps) {
	if (singleReportMode) {
		const pages = summaryRow.reports[0]?.pages ?? [];
		return (
			<div className="space-y-2 rounded border border-ctp-surface2 bg-ctp-mantle p-2">
				<p className="text-xs font-semibold uppercase tracking-wide text-(--app-fg-secondary)">Page breakdown</p>
				<table className="w-full border-collapse text-xs">
					<thead>
						<tr className="bg-ctp-surface0">
							<th className="border border-ctp-surface2 px-2 py-1 text-left">Page</th>
							<th className="border border-ctp-surface2 px-2 py-1 text-right">Uses</th>
							<th className="border border-ctp-surface2 px-2 py-1 text-right">Visuals</th>
						</tr>
					</thead>
					<tbody>
						{pages.length > 0 ? (
							pages.map((page, pageIndex) => (
								<tr
									key={`${summaryRow.id}:${page.page}`}
									className={`${zebraRowClass(pageIndex)} text-(--app-fg-secondary)`}
								>
									<td className={`border ${gridBorderClass} px-2 py-1 text-left`}>{page.page}</td>
									<td className={`border ${gridBorderClass} px-2 py-1 text-right`}>{page.count}</td>
									<td className={`border ${gridBorderClass} px-2 py-1 text-right`}>{page.distinctVisuals}</td>
								</tr>
							))
						) : (
							<tr className="bg-(--app-zebra-row-first) text-(--app-fg-secondary)">
								<td colSpan={3} className={`border ${gridBorderClass} px-2 py-1 text-center`}>
									No pages found for this field.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		);
	}

	return (
		<div className="space-y-2 rounded border border-ctp-surface2 bg-ctp-mantle p-2">
			<p className="text-xs font-semibold uppercase tracking-wide text-(--app-fg-secondary)">Per-report breakdown</p>
			<table className="w-full border-collapse text-xs">
				<thead>
					<tr className="bg-ctp-surface0">
						<th className="border border-ctp-surface2 px-2 py-1 text-left">Report</th>
						<th className="border border-ctp-surface2 px-2 py-1 text-right">Total uses</th>
						<th className="border border-ctp-surface2 px-2 py-1 text-right">Pages</th>
						<th className="border border-ctp-surface2 px-2 py-1 text-right">Visuals</th>
					</tr>
				</thead>
				<tbody>
					{summaryRow.reports.map((report, reportIndex) => {
						const reportKey = `${summaryRow.id}:${report.report}`;
						const expanded = isReportExpanded(reportKey);
						return (
							<Fragment key={reportKey}>
								<tr className={zebraRowClass(reportIndex)}>
									<td className="border border-ctp-surface2 px-2 py-1 text-left">
								<button
									type="button"
									onClick={() => onToggleReport(reportKey)}
									aria-expanded={expanded}
									className="inline-flex items-center gap-1 text-left text-(--app-fg-secondary) transition-colors hover:text-(--app-fg-accent-text)"
									aria-label={`Toggle report ${report.report}`}
									title={`Toggle report ${report.report}`}
								>
											<span className="inline-flex h-4 w-4 items-center justify-center text-sm leading-none">
												{expanded ? (
													<Minus aria-hidden="true" className="h-4 w-4" />
												) : (
													<Plus aria-hidden="true" className="h-4 w-4" />
												)}
											</span>
											{report.report}
										</button>
									</td>
									<td className="border border-ctp-surface2 px-2 py-1 text-right">{report.totalUses}</td>
									<td className="border border-ctp-surface2 px-2 py-1 text-right">{report.pageCount}</td>
									<td className="border border-ctp-surface2 px-2 py-1 text-right">{report.visualCount}</td>
								</tr>
								{expanded
									? report.pages.map((page, pageIndex) => (
											<tr
												key={`${reportKey}:${page.page}`}
												className={`${zebraRowClass(pageIndex)} text-(--app-fg-secondary)`}
											>
												<td className={`border ${gridBorderClass} px-6 py-1 text-left`}>{page.page}</td>
												<td className={`border ${gridBorderClass} px-2 py-1 text-right`}>{page.count}</td>
												<td className={`border ${gridBorderClass} px-2 py-1 text-right`}>-</td>
												<td className={`border ${gridBorderClass} px-2 py-1 text-right`}>{page.distinctVisuals}</td>
											</tr>
									  ))
									: null}
							</Fragment>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
