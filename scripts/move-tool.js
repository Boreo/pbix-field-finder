// scripts/move-tool.js
import fs from "node:fs";

fs.copyFileSync(
  "dist-tool/pbix-field-finder.html",
  "pbix-field-finder.html"
);
