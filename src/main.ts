import { loadPbixLayout } from "./io/pbix-loader.ts"
import { isPbixError } from "./core/errors.ts"

const input = document.createElement("input")
input.type = "file"
input.accept = ".pbix,.zip"

input.addEventListener("change", async () => {
  const file = input.files?.[0]
  if (!file) return

  try {
    const layout = await loadPbixLayout(file)
    console.log("Layout loaded:", layout)
  } catch (err) {
    if (isPbixError(err)) {
      err.show()
      return
    }
    throw err
  }
})

document.body.appendChild(input)