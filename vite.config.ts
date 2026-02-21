import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

function manualChunks(id: string): string | undefined {
	if (!id.includes("node_modules")) {
		return undefined;
	}
	if (id.includes("jszip") || id.includes("papaparse")) {
		return "vendor-data";
	}
	return "vendor";
}

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	build: {
		chunkSizeWarningLimit: 425,
		rollupOptions: {
			output: {
				manualChunks,
			},
		},
	},
});
