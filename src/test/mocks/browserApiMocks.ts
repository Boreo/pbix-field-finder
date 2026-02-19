import { vi } from "vitest";

const restoreCallbacks: Array<() => void> = [];

export function mockClipboard() {
	const writeText = vi.fn(async (_text: string) => undefined);
	const hadClipboard = "clipboard" in navigator;
	const originalClipboard = navigator.clipboard;

	Object.defineProperty(navigator, "clipboard", {
		configurable: true,
		value: { writeText },
	});

	restoreCallbacks.push(() => {
		if (hadClipboard) {
			Object.defineProperty(navigator, "clipboard", {
				configurable: true,
				value: originalClipboard,
			});
			return;
		}
		Reflect.deleteProperty(navigator, "clipboard");
	});

	return { writeText };
}

export function mockDownload() {
	const createdUrls: Blob[] = [];
	const clickedLinks: HTMLAnchorElement[] = [];

	const originalCreateObjectURL = URL.createObjectURL;
	const originalRevokeObjectURL = URL.revokeObjectURL;
	const originalBlob = globalThis.Blob;

	class MockBlob {
		public readonly size: number;
		public readonly type: string;
		private readonly textContent: string;

		constructor(parts: unknown[] = [], options: { type?: string } = {}) {
			this.type = options.type ?? "";
			this.textContent = parts
				.map((part) => {
					if (typeof part === "string") {
						return part;
					}
					if (part instanceof Uint8Array) {
						return new TextDecoder().decode(part);
					}
					return String(part);
				})
				.join("");
			this.size = this.textContent.length;
		}

		async text(): Promise<string> {
			return this.textContent;
		}
	}

	Object.defineProperty(globalThis, "Blob", {
		configurable: true,
		writable: true,
		value: MockBlob,
	});

	Object.defineProperty(URL, "createObjectURL", {
		configurable: true,
		writable: true,
		value: vi.fn((blob: Blob) => {
			createdUrls.push(blob);
			return `blob:mock-${createdUrls.length}`;
		}),
	});
	Object.defineProperty(URL, "revokeObjectURL", {
		configurable: true,
		writable: true,
		value: vi.fn(),
	});

	const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
		clickedLinks.push(this);
	});

	restoreCallbacks.push(() => {
		clickSpy.mockRestore();
		Object.defineProperty(globalThis, "Blob", {
			configurable: true,
			writable: true,
			value: originalBlob,
		});
		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			writable: true,
			value: originalCreateObjectURL,
		});
		Object.defineProperty(URL, "revokeObjectURL", {
			configurable: true,
			writable: true,
			value: originalRevokeObjectURL,
		});
	});

	return {
		createObjectURL: URL.createObjectURL as ReturnType<typeof vi.fn>,
		revokeObjectURL: URL.revokeObjectURL as ReturnType<typeof vi.fn>,
		clickedLinks,
		createdUrls,
	};
}

export function cleanupBrowserMocks() {
	while (restoreCallbacks.length > 0) {
		const restore = restoreCallbacks.pop();
		restore?.();
	}
}
