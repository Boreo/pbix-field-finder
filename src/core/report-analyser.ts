// src/core/report-analyser.ts

import type { PbixLayout } from "./types"

export type VisualFieldUsage = {
    page: string
    visualType: string
    role: string
    queryRef: string
    kind: "measure" | "column" | "unknown"
}

function classifyField(queryRef: string, select: any[]): "measure" | "column" | "unknown" {
    const sel = select.find(s => s.Name === queryRef)
    if (!sel) return "unknown"

    if (sel.Aggregation) return "measure"
    if (sel.Expression?.Column) return "column"

    return "unknown"
}

export function extractVisualFieldUsage(layout: PbixLayout): VisualFieldUsage[] {
    const usage: VisualFieldUsage[] = []

    layout.sections?.forEach(section => {
        section.visualContainers?.forEach(visual => {
            const cfg =
                typeof visual.config === "string"
                    ? JSON.parse(visual.config)
                    : visual.config

            const sv = cfg?.singleVisual
            if (!sv?.projections) return

            const select = sv.prototypeQuery?.Select ?? []
            const visualType = sv.visualType ?? "unknown"

            for (const [role, items] of Object.entries(sv.projections)) {
                for (const item of items as any[]) {
                    if (!item.queryRef) continue

                    usage.push({
                        page: section.displayName ?? "",
                        visualType,
                        role,
                        queryRef: item.queryRef,
                        kind: classifyField(item.queryRef, select)
                    })
                }
            }
        })
    })

    return usage
}
