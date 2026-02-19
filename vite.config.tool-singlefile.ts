import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: "dist-tool",
    emptyOutDir: true,

    // Make it easier for the plugin to inline everything
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,

    rollupOptions: {
      input: "pbix-field-finder.html",
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
