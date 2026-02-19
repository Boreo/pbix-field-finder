# Power BI Field Usage Finder

Find field usage in Power BI `.pbix` files, fast and fully in-browser.

All processing happens on your device. Nothing is uploaded or sent to a server.

Live app: https://pbix-field-finder.vercel.app/

## Use

- Open the web app.
- Choose a `.pbix` file.
- Review results and export to `CSV` or `JSON`.

## Download the portable HTML

If you want a single-file, standalone build (no Node.js, no dev server), download:
- [`pbix-field-finder.html`](./pbix-field-finder.html)

Useful for sharing internally, restricted environments, and offline workflows.

## Why this tool

This tool is designed for quick field-usage lookup. It avoids the heavier modelling workflow used by the template, so you can get answers faster when you just need "where is this field used?"


## Credits

- Power BI Template (for deeper data modelling context and answering "what's not used"): https://github.com/stephbruno/Power-BI-Field-Finder
- Theme: https://github.com/catppuccin (contrast-adjusted)

## Build
```bash
npm run build
```
#### Standalone HTML Tool
```bash
npm run build:tool
```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
