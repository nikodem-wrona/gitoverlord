import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const packageFile = new URL("./package.json", import.meta.url);
const { version } = JSON.parse(readFileSync(packageFile, "utf8")) as {
  version: string;
};

export default defineConfig({
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
    // A `?raw` import of a CSS file gives its text. The theme contrast test reads the tokens.
    css: { include: [/\.css\?raw$/] },
  },
});
