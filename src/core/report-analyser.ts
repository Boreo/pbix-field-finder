// src/core/report-analyser.ts

import type { PbixLayout } from "./types"

// Represents a single instance of a field being used by a visual.
export type VisualFieldUsage = {
    page: string
    visualType: string
    role: string
    queryRef: string
    kind: "measure" | "column" | "unknown"
}

// Normalised, report-wide fact row describing field usage.
type FieldUsageRow = {
    report: string
    page: string
    table: string | null
    field: string | null
    expression: string | null
    visualType: string
}

//Classifies a query reference as a column, measure, or unknown using the visual's prototype query metadata.
function classifyField(queryRef: string, select: any[]): "measure" | "column" | "unknown" {
    const sel = select.find(s => s.Name === queryRef)
    if (!sel) return "unknown"

    if (sel.Aggregation) return "measure"
    if (sel.Expression?.Column) return "column"

    return "unknown"
}

//Walks all sections and visuals in a PBIX layout and extracts field usage information.
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

// Normalises a query reference into table, field, and expression components for relational analysis.
function normaliseQueryRef(queryRef: string): {
    table: string | null
    field: string | null
    expression: string | null
} {
    // Expression (measure or calc)
    if (queryRef.includes("(")) {
        const m = queryRef.match(/([A-Za-z0-9_]+)\.([A-Za-z0-9_ ]+)/)
        return {
            table: m?.[1] ?? null,
            field: m?.[2]?.trim() ?? null,
            expression: queryRef
        }
    }

    // Table.Column
    const dotIndex = queryRef.indexOf(".")
    if (dotIndex > 0) {
        return {
            table: queryRef.slice(0, dotIndex),
            field: queryRef.slice(dotIndex + 1).trim(),
            expression: null
        }
    }

    // Fallback
    return {
        table: null,
        field: queryRef,
        expression: null
    }
}

//Converts event-level visual field usage into a normalised fact table suitable for grouping, totals, and export.
export function buildFieldUsageTable(
    usage: VisualFieldUsage[],
    reportName: string
): FieldUsageRow[] {
    return usage.map(u => {
        const norm = normaliseQueryRef(u.queryRef)

        return {
            report: reportName,
            page: u.page,
            table: norm.table,
            field: norm.field,
            expression: norm.expression,
            visualType: u.visualType
        }
    })
}