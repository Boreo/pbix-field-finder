// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./ui/App";


const appRoot = document.getElementById("app");

if (!appRoot) {
	throw new Error("App root (#app) not found.");
}

createRoot(appRoot).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
