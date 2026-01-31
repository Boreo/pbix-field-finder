export class PbixError extends Error {
  public readonly code:
    | "PBIX_NOT_ZIP"
    | "LAYOUT_NOT_FOUND"
    | "LAYOUT_DECODE_FAILED"
    | "LAYOUT_PARSE_FAILED"

  constructor(
    message: string,
    code:
      | "PBIX_NOT_ZIP"
      | "LAYOUT_NOT_FOUND"
      | "LAYOUT_DECODE_FAILED"
      | "LAYOUT_PARSE_FAILED"
  ) {
    super(message)
    this.name = "PbixError"
    this.code = code
  }
}