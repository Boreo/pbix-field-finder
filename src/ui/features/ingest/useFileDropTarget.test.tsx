import { act, renderHook } from "@testing-library/react";
import type { DragEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { useFileDropTarget } from "./useFileDropTarget";

function createDragEvent(files: File[] = []) {
	return {
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		dataTransfer: { files },
	} as unknown as DragEvent<HTMLElement>;
}

describe("useFileDropTarget", () => {
	it("tracks drag depth and clears active state when drag leaves", () => {
		const { result } = renderHook(() =>
			useFileDropTarget({
				disabled: false,
				onFilesDropped: vi.fn(),
			}),
		);

		const enterOne = createDragEvent();
		const enterTwo = createDragEvent();
		const leaveOne = createDragEvent();
		const leaveTwo = createDragEvent();

		act(() => {
			result.current.onDragEnter(enterOne);
			result.current.onDragEnter(enterTwo);
		});
		expect(result.current.dragActive).toBe(true);

		act(() => {
			result.current.onDragLeave(leaveOne);
		});
		expect(result.current.dragActive).toBe(true);

		act(() => {
			result.current.onDragLeave(leaveTwo);
		});
		expect(result.current.dragActive).toBe(false);
		expect(enterOne.preventDefault).toHaveBeenCalled();
		expect(leaveTwo.stopPropagation).toHaveBeenCalled();
	});

	it("calls onFilesDropped with dropped files and resets drag state", () => {
		const onFilesDropped = vi.fn();
		const { result } = renderHook(() =>
			useFileDropTarget({
				disabled: false,
				onFilesDropped,
			}),
		);

		const drop = createDragEvent([new File(["x"], "report.pbix")]);

		act(() => {
			result.current.onDragEnter(createDragEvent());
			result.current.onDrop(drop);
		});

		expect(result.current.dragActive).toBe(false);
		expect(onFilesDropped).toHaveBeenCalledTimes(1);
		expect(onFilesDropped.mock.calls[0]?.[0]).toHaveLength(1);
	});

	it("ignores drag state and drop callbacks when disabled", () => {
		const onFilesDropped = vi.fn();
		const { result } = renderHook(() =>
			useFileDropTarget({
				disabled: true,
				onFilesDropped,
			}),
		);

		act(() => {
			result.current.onDragEnter(createDragEvent());
			result.current.onDrop(createDragEvent([new File(["x"], "report.pbix")]));
		});

		expect(result.current.dragActive).toBe(false);
		expect(onFilesDropped).not.toHaveBeenCalled();
	});

	it("prevents default and propagation on drag over", () => {
		const { result } = renderHook(() =>
			useFileDropTarget({
				disabled: false,
				onFilesDropped: vi.fn(),
			}),
		);

		const over = createDragEvent();
		act(() => {
			result.current.onDragOver(over);
		});

		expect(over.preventDefault).toHaveBeenCalledTimes(1);
		expect(over.stopPropagation).toHaveBeenCalledTimes(1);
	});
});
