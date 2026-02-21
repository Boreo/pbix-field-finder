// src/ui/lib/cn.ts
/**
 * Join conditional class-name fragments into a single space-delimited string.
 * @param inputs Class-name fragments where falsy entries are ignored.
 * @returns A class-name string suitable for JSX `className`.
 */
export function cn(
	...inputs: (string | false | null | undefined)[]
): string {
	return inputs.filter(Boolean).join(" ");
}
