# Power BI Field Usage Finder (PBIX)

Fast field-usage lookup for Power BI `.pbix` reports, fully in-browser.

All processing happens on your device. Nothing is uploaded or sent to a server.

Live app: https://pbix-field-finder.vercel.app/

## What it does

- Find where a table/column/measure is used across visuals and pages.
- Export results to `CSV` or `JSON`.
- Supports PBIX reports using the new PBIR enhanced metadata format (and legacy PBIX).
- Works offline once loaded.

## Use

- Open the web app.
- Drop or select a `.pbix` file.
- Review results and export to `CSV` or `JSON`.

## Download the portable HTML

Single-file, standalone build you can open directly in a browser (no Node.js, no dev server).

Download `pbix-field-finder.html` from the [latest release](https://github.com/Boreo/pbix-field-finder/releases/latest).

Useful for internal sharing, restricted environments, or offline use.

## Why this tool

Optimised for quick field usage answers. For deeper data modelling context and "what's not used", use the template below.

## Credits

- For deeper data modelling context: Power BI Field Finder (with data model) — https://github.com/stephbruno/Power-BI-Field-Finder
- Theme: https://github.com/catppuccin (contrast-adjusted)

## Development

```bash
npm install
npm run dev
npm run build
npm run build:tool
```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
