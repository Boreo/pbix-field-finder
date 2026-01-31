import JSZip from "jszip"

export async function loadPbixLayout(file: File): Promise<any> {
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)

  
  const layoutFile =
    zip.file("Report/Layout") ??
    zip.file("Report/Layout.json")

  if (!layoutFile) {
    throw new Error("Report/Layout not found in PBIX")
  }
  const layoutBuffer = await layoutFile.async("arraybuffer")
  const decoder = new TextDecoder("utf-16le")
  const layoutText = decoder.decode(layoutBuffer)


  return JSON.parse(layoutText)
}
