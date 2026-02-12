// src/core/json.ts

export type JsonParseResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: unknown };

export function parseJsonString<T>(jsonText: string): JsonParseResult<T> {
	try {
		return {
			ok: true,
			value: JSON.parse(jsonText) as T,
		};
	} catch (error) {
		return {
			ok: false,
			error,
		};
	}
}

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
