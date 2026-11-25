import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

const packageFile = new URL("./package.json", import.meta.url);
const { version } = JSON.parse(readFileSync(packageFile, "utf8")) as {
  version: string;
};

/**
 * `vite build --mode demo` builds the web demo: the application with the demo backend.
 * GitHub Pages serves it from `dist-site/demo/`, below the landing page, so its URLs are relative.
 */
const demoBuild = { base: "./", build: { outDir: "dist-site/demo" } };

export default defineConfig(({ mode }) => ({
  ...(mode === "demo" ? demoBuild : {}),
  plugins: [react()],
  // The status bar shows the version. The release workflow checks that it is the version of the tag.
  define: { "import.meta.env.APP_VERSION": JSON.stringify(version) },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Tauri prints Rust errors in the same terminal. Do not clear them.
  clearScreen: false,
  server: {
    // Tauri expects this port. Fail if the port is not available.
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**", "**/crates/**", "**/target/**"] },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // The worktrees of Claude Code sessions hold other copies of the tests.
    exclude: [...configDefaults.exclude, ".claude/worktrees/**"],
    // A `?raw` import of a CSS file gives its text. The theme contrast test reads the tokens.
    css: { include: [/\.css\?raw$/] },
  },
}));
