import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist-tool",
    emptyOutDir: true,

    // Make it easier for the plugin to inline everything
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,

    rollupOptions: {
      input: "index.html",
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
