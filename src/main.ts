import { loadPbixLayout } from "./io/pbix-loader.ts"

const input = document.createElement("input")
input.type = "file"
input.accept = ".pbix"

input.addEventListener("change", async () => {
  const file = input.files?.[0]
  if (!file) return

  try {
    const layout = await loadPbixLayout(file)
    console.log("Layout loaded:", layout)
    console.log(layout.sections.map(s => s.displayName))
  } catch (err) {
    console.error("Failed to load PBIX", err)
  }
})

document.body.appendChild(input)