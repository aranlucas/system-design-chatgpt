import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// MCP Apps hosts need inline JavaScript and stable HTML asset names, with no external chunks.
export default defineConfig(({ mode }) => {
  const workspace = mode === "workspace";

  return {
    root: fileURLToPath(new URL("./src/view/", import.meta.url)),
    publicDir: false,
    plugins: [
      viteSingleFile({ outputFileName: workspace ? "mcp-workspace.html" : "mcp-view.html" }),
    ],
    build: {
      outDir: fileURLToPath(new URL("./public/", import.meta.url)),
      // Keep fonts, icons and the other view when building one HTML entry at a time.
      emptyOutDir: false,
      rolldownOptions: {
        input: fileURLToPath(
          new URL(
            workspace ? "workspace.html" : "index.html",
            new URL("./src/view/", import.meta.url),
          ),
        ),
      },
    },
  };
});
