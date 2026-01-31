import JSZip from "jszip"
import { PbixError } from "../core/errors"

export async function loadPbixLayout(file: File): Promise<any> {
  let zip: JSZip

  try {
    const buffer = await file.arrayBuffer()
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new PbixError(
      "File is not a valid PBIX or ZIP archive",
      "PBIX_NOT_ZIP"
    )
  }

  const layoutFile =
    zip.file("Report/Layout") ??
    zip.file("Report/Layout.json")

  if (!layoutFile) {
    throw new PbixError(
      "Report layout not found in PBIX",
      "LAYOUT_NOT_FOUND"
    )
  }

  let layoutText: string
  try {
    const layoutBuffer = await layoutFile.async("arraybuffer")
    const decoder = new TextDecoder("utf-16le")
    layoutText = decoder.decode(layoutBuffer)
  } catch {
    throw new PbixError(
      "Failed to decode report layout",
      "LAYOUT_DECODE_FAILED"
    )
  }

  try {
    return JSON.parse(layoutText)
  } catch {
    throw new PbixError(
      "Report layout is not valid JSON",
      "LAYOUT_PARSE_FAILED"
    )
  }
}
