// src/core/errors.ts
// Domain-level PBIX processing errors. UI messaging lives in the UI layer.

export type PbixErrorCode =
	| "PBIX_NOT_ZIP"
	| "LAYOUT_NOT_FOUND"
	| "LAYOUT_DECODE_FAILED"
	| "LAYOUT_PARSE_FAILED";

export class PbixError extends Error {
	public readonly code: PbixErrorCode;

	constructor(code: PbixErrorCode, cause?: unknown) {
		super(`PBIX_ERROR:${code}`, { cause });
		this.name = "PbixError";
		this.code = code;
	}
}

export function isPbixError(error: unknown): error is PbixError {
	return error instanceof PbixError;
}
