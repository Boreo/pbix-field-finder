import JSZip from "jszip"
import { PbixError } from "../core/errors"
import type { PbixLayout } from "../core/types"

export async function loadPbixLayout(file: File): Promise<PbixLayout> {
  let zip: JSZip

  try {
    const buffer = await file.arrayBuffer()
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new PbixError(
      "PBIX_NOT_ZIP"
    )
  }

  const layoutFile =
    zip.file("Report/Layout") ??
    zip.file("Report/Layout.json")

  if (!layoutFile) {
    throw new PbixError(
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
      "LAYOUT_DECODE_FAILED"
    )
  }

  try {
    return JSON.parse(layoutText) as PbixLayout
  } catch {
    throw new PbixError(
      "LAYOUT_PARSE_FAILED"
    )
  }


}
