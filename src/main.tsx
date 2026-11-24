import { isTauri } from "@tauri-apps/api/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import "@/hud/global.css";

// A browser has no Rust core. The sample repository replaces it in `pnpm dev`
// and in the web demo, which `pnpm build:demo` builds.
// The release bundle does not contain this code.
const demoBuild = import.meta.env.DEV || import.meta.env.MODE === "demo";
if (demoBuild && !isTauri()) {
  const { installDemoBackend } = await import("@/demo");
  installDemoBackend();
}

const root = document.getElementById("root");
if (!root) throw new Error("The #root element is missing from index.html.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
