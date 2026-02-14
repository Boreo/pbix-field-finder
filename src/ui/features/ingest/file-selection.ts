// src/ui/features/ingest/file-selection.ts

const PBIX_FILE_PATTERN = /\.(pbix|zip)$/i;

export type FileSelection = {
	accepted: File[];
	rejected: File[];
};

export function splitSupportedPbixFiles(files: File[]): FileSelection {
	const accepted: File[] = [];
	const rejected: File[] = [];

	for (const file of files) {
		if (PBIX_FILE_PATTERN.test(file.name)) {
			accepted.push(file);
			continue;
		}
		rejected.push(file);
	}

	return { accepted, rejected };
}

export function buildUnsupportedFilesMessage(files: File[]): string {
	return `Unsupported files: ${files.map((file) => file.name).join(", ")}.`;
}
