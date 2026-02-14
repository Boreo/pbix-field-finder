// src/ui/features/ingest/useFileDropTarget.ts
import { useRef, useState, type DragEvent } from "react";

type UseFileDropTargetOptions = {
	disabled: boolean;
	onFilesDropped: (files: File[]) => void;
};

function stopDragEvent(event: DragEvent<HTMLElement>) {
	event.preventDefault();
	event.stopPropagation();
}

export function useFileDropTarget({ disabled, onFilesDropped }: UseFileDropTargetOptions) {
	const dragDepth = useRef(0);
	const [dragActive, setDragActive] = useState(false);

	const onDragEnter = (event: DragEvent<HTMLElement>) => {
		stopDragEvent(event);
		if (disabled) {
			return;
		}
		dragDepth.current += 1;
		setDragActive(true);
	};

	const onDragLeave = (event: DragEvent<HTMLElement>) => {
		stopDragEvent(event);
		if (disabled) {
			return;
		}
		dragDepth.current = Math.max(0, dragDepth.current - 1);
		if (dragDepth.current === 0) {
			setDragActive(false);
		}
	};

	const onDragOver = (event: DragEvent<HTMLElement>) => {
		stopDragEvent(event);
	};

	const onDrop = (event: DragEvent<HTMLElement>) => {
		stopDragEvent(event);
		if (disabled) {
			return;
		}
		dragDepth.current = 0;
		setDragActive(false);
		const droppedFiles = Array.from(event.dataTransfer.files ?? []);
		if (droppedFiles.length > 0) {
			onFilesDropped(droppedFiles);
		}
	};

	return {
		dragActive,
		onDragEnter,
		onDragLeave,
		onDragOver,
		onDrop,
	};
}
