export type PbixErrorCode =
  | "PBIX_NOT_ZIP"
  | "LAYOUT_NOT_FOUND"
  | "LAYOUT_DECODE_FAILED"
  | "LAYOUT_PARSE_FAILED"

export function isPbixError(err: unknown): err is PbixError {
  return err instanceof PbixError
}

export class PbixError extends Error {
  public readonly code: PbixErrorCode

  constructor(message: string, code: PbixErrorCode) {
    super(message)
    this.name = "PbixError"
    this.code = code
  }

  get displayMessage(): string {
    switch (this.code) {
      case "PBIX_NOT_ZIP":
        return "The selected file is not a valid PBIX file."
      case "LAYOUT_NOT_FOUND":
        return "The PBIX file does not contain a report layout."
      case "LAYOUT_DECODE_FAILED":
        return "The report layout could not be decoded."
      case "LAYOUT_PARSE_FAILED":
        return "The report layout is corrupted."
    }
  }

  show(): void {
    const dialog = document.createElement("dialog")

    dialog.innerHTML = `
      <form method="dialog">
        <p>${this.displayMessage}</p>
        <menu>
          <button autofocus>OK</button>
        </menu>
      </form>
    `

    document.body.appendChild(dialog)
    dialog.showModal()

    dialog.addEventListener("close", () => {
      dialog.remove()
    })
  }
}