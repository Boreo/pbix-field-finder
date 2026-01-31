// ./core/errors.ts

export type PbixErrorCode =
    | "PBIX_NOT_ZIP"
    | "LAYOUT_NOT_FOUND"
    | "LAYOUT_DECODE_FAILED"
    | "LAYOUT_PARSE_FAILED"
    | "VISUAL_CONFIG_MISSING";

export function isPbixError(err: unknown): err is PbixError {
    return err instanceof PbixError;
}

export class PbixError extends Error {
    public readonly code: PbixErrorCode;

    constructor(code: PbixErrorCode, cause?: unknown) {
        super(`PBIX_ERROR:${code}`, { cause });
        this.name = "PbixError";
        this.code = code;
    }

    get displayMessage(): string {
        switch (this.code) {
            case "PBIX_NOT_ZIP":
                return "The selected file is not a valid PBIX file.";
            case "LAYOUT_NOT_FOUND":
                return "The PBIX file does not contain a report layout.";
            case "LAYOUT_DECODE_FAILED":
                return "The report layout could not be decoded.";
            case "LAYOUT_PARSE_FAILED":
                return "The report layout is corrupted.";
            case "VISUAL_CONFIG_MISSING":
                return "No visual configuration found in the report layout.";
        }
    }

    show(): void {
    console.group(`PbixError: ${this.code}`)
    console.error(this.displayMessage)

    let current: unknown = this
    while (current instanceof Error) {
        if (current.stack) {
        console.error(current.stack)
        }
        current = (current as any).cause
        if (current) {
        console.info("Caused by:")
        }
    }

    console.groupEnd()

    const dialog = document.createElement("dialog")
    dialog.innerHTML = `
        <form method="dialog">
        <p>${this.displayMessage}</p>
        <menu><button autofocus>OK</button></menu>
        </form>
    `
    document.body.appendChild(dialog)
    dialog.showModal()
    dialog.addEventListener("close", () => dialog.remove())
    }


}
