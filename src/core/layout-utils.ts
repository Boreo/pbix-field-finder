// src/core/layout-utils.ts

import type { PbixLayout, PbixSection, PbixVisualContainer } from "./types"
import { PbixError } from "./errors"

export function getFirstSection(layout: PbixLayout): PbixSection {
    const section = layout.sections?.[0]
    if (!section) {
        throw new PbixError(
            "LAYOUT_PARSE_FAILED",
            new Error("Layout contains no sections")
        )
    }
    return section
}

export function getFirstVisual(section: PbixSection): PbixVisualContainer {
    const visual = section.visualContainers?.[0]
    if (!visual) {
        throw new PbixError(
            "VISUAL_CONFIG_MISSING",
            new Error("Section contains no visualContainers[0]")
        )
    }
    return visual
}

export function parseVisualConfig(visual: PbixVisualContainer): unknown {
    if (!visual.config) {
        throw new PbixError(
            "VISUAL_CONFIG_MISSING",
            new Error("visual.config is missing")
        )
    }

    if (typeof visual.config === "string") {
        try {
            return JSON.parse(visual.config)
        } catch (err) {
            throw new PbixError("LAYOUT_PARSE_FAILED", err)
        }
    }

    return visual.config
}