// src/ui/lib/cn.ts
export function cn(
	...inputs: (string | false | null | undefined)[]
): string {
	return inputs.filter(Boolean).join(" ");
}
