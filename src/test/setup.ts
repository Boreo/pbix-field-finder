// src/test/setup.ts
import "@testing-library/jest-dom/vitest";

// Headless UI needs ResizeObserver; jsdom doesn't ship one.
globalThis.ResizeObserver ??= class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof globalThis.ResizeObserver;

const localStorageState = new Map<string, string>();

const localStorageMock: Storage = {
	get length() {
		return localStorageState.size;
	},
	clear() {
		localStorageState.clear();
	},
	getItem(key: string) {
		return localStorageState.has(key) ? localStorageState.get(key)! : null;
	},
	key(index: number) {
		return Array.from(localStorageState.keys())[index] ?? null;
	},
	removeItem(key: string) {
		localStorageState.delete(key);
	},
	setItem(key: string, value: string) {
		localStorageState.set(key, String(value));
	},
};

Object.defineProperty(window, "localStorage", {
	configurable: true,
	value: localStorageMock,
});
