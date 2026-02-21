// src/ui/features/ingest/file-selection.ts

const PBIX_FILE_PATTERN = /\.(pbix|zip)$/i;

export type FileSelection = {
	accepted: File[];
	rejected: File[];
};

/**
 * Split an incoming file list into supported PBIX files and rejected files.
 * @param files Files dropped or selected from the browser file picker.
 * @returns Accepted `.pbix`/`.zip` files plus rejected files for validation feedback.
 */
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

/**
 * Build a user-facing validation message for unsupported file extensions.
 * @param files Rejected files that did not match supported PBIX patterns.
 * @returns A comma-separated error message listing unsupported filenames.
 */
export function buildUnsupportedFilesMessage(files: File[]): string {
	return `Unsupported files: ${files.map((file) => file.name).join(", ")}.`;
}
