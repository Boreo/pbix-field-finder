// main.ts

import { loadPbixLayout } from "./io/pbix-loader";
import { extractVisualFieldUsage, buildFieldUsageTable } from './core/report-analyser';
import { isPbixError } from "./core/errors";
import type { PbixLayout } from "./core/types";

const input = document.createElement("input")
input.type = "file"
input.accept = ".pbix,.zip"


input.addEventListener("change", async () => {
  const file = input.files?.[0]
  if (!file) return

  let layout: PbixLayout

  try {
    const layout = await loadPbixLayout(file)

    const visualUsage = extractVisualFieldUsage(layout)
    console.table(visualUsage)

    const fieldUsageTable = buildFieldUsageTable(visualUsage,file.name.replace(/\.(pbix|zip)$/i, ""))
    console.table(fieldUsageTable)

    console.table(
      visualUsage.filter(u => u.role === "report-filter")
    )

    

  } catch (err) {
    if (isPbixError(err)) {
      err.show()
      return
    }
    throw err
  }

  
})

document.body.appendChild(input)
