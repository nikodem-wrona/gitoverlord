import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { defineConfig, type Plugin } from "vite";

// The landing page in `site/`. GitHub Pages serves the build from `dist-site/`.
const repoRoot = fileURLToPath(new URL(".", import.meta.url)).replaceAll(
  "\\",
  "/",
);
const packageFile = new URL("./package.json", import.meta.url);
const { version } = JSON.parse(readFileSync(packageFile, "utf8")) as {
  version: string;
};

// The page shows files of the repository with a path such as `../docs/images/history.png`.
const REPO_ASSETS = ["/docs/images/", "/src-tauri/icons/"];

/**
 * The build reads a repository file from the disk. A browser removes the `../`
 * from the request, so the development server must find the file in the repository.
 */
function serveRepoAssets(): Plugin {
  return {
    name: "serve-repo-assets",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = request.url ?? "";
        if (REPO_ASSETS.some((prefix) => url.startsWith(prefix))) {
          request.url = `/@fs/${repoRoot.replace(/^\//, "")}${url.slice(1)}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: "site",
  // Relative URLs, so that the page works at each address, with or without a custom domain.
  base: "./",
  plugins: [serveRepoAssets()],
  // `%APP_VERSION%` in the page becomes the version in `package.json`.
  define: { "import.meta.env.APP_VERSION": JSON.stringify(version) },
  build: { outDir: "../dist-site", emptyOutDir: true },
  server: {
    // The application uses port 1420. Fail if this port is not available.
    port: 1430,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  preview: { port: 1430, strictPort: true },
});
