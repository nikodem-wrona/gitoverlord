import { isTauri } from "@tauri-apps/api/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import "@/hud/global.css";

// `pnpm dev` in a browser has no Rust core. The sample repository replaces it.
// The release bundle does not contain this code.
if (import.meta.env.DEV && !isTauri()) {
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
