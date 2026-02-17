// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import appFavicon from "./assets/icons/pbix-field-finder.svg";
import { App } from "./ui/App";


const appRoot = document.getElementById("app");
const faviconLink = document.getElementById("app-favicon") as HTMLLinkElement | null;

if (!appRoot) {
	throw new Error("App root (#app) not found.");
}

if (faviconLink) {
	faviconLink.href = appFavicon;
}

createRoot(appRoot).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
