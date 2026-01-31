// main.ts

import { loadPbixLayout } from "./io/pbix-loader";
import { isPbixError } from "./core/errors";
import type { PbixLayout } from "./core/types";
import { getFirstSection, getFirstVisual, parseVisualConfig } from "./core/layout-utils";

const input = document.createElement("input")
input.type = "file"
input.accept = ".pbix,.zip"

input.addEventListener("change", async () => {
  const file = input.files?.[0]
  if (!file) return

  let layout: PbixLayout

  try {
    layout = await loadPbixLayout(file)

    const section = getFirstSection(layout)
    const visual = getFirstVisual(section)
    const config = parseVisualConfig(visual)

    console.log("Parsed visual config keys:", Object.keys(config as object))
  } catch (err) {
    if (isPbixError(err)) {
      err.show()
      return
    }
    throw err
  }
})

document.body.appendChild(input)
