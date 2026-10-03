import { bindings, defineConfig, exports } from "cf/config";

import { RUN_WORKER_FIRST } from "./src/worker/oauth-paths.ts";

// Replace placeholder IDs with this repository's own resources before deployment.
const COMPATIBILITY_FLAGS = ["nodejs_compat", "global_fetch_strictly_public"];

export default defineConfig((ctx) => {
  if (ctx.isPreview) {
    return {
      worker: {
        exports: {
          DiagramRoom: exports.durableObject({ storage: "sqlite" }),
        },
        name: "system-design-chatgpt",
        compatibilityDate: "2026-09-01",
        compatibilityFlags: COMPATIBILITY_FLAGS,
        entrypoint: "src/worker/index.ts",
        observability: {
          enabled: true,
        },
        assets: {
          notFoundHandling: "single-page-application",
          runWorkerFirst: RUN_WORKER_FIRST,
        },
        env: {
          DB: bindings.d1({
            name: "system-design-chatgpt-preview",
            id: "00000000-0000-0000-0000-000000000002",
          }),
          BUCKET: bindings.r2({
            name: "system-design-chatgpt-preview",
          }),
          // bindings.kv takes only the id; wrangler.jsonc is where the name lives.
          OAUTH_KV: bindings.kv({ id: "00000000000000000000000000000002" }),
          ROOM: bindings.durableObject({
            worker: "system-design-chatgpt",
            exportName: "DiagramRoom",
          }),
          ASSETS: bindings.assets(),
        },
      },
    };
  }

  return {
    worker: {
      exports: {
        DiagramRoom: exports.durableObject({ storage: "sqlite" }),
      },
      name: "system-design-chatgpt",
      compatibilityDate: "2026-09-01",
      compatibilityFlags: COMPATIBILITY_FLAGS,
      entrypoint: "src/worker/index.ts",
      observability: {
        enabled: true,
      },
      assets: {
        notFoundHandling: "single-page-application",
        runWorkerFirst: RUN_WORKER_FIRST,
      },
      env: {
        DB: bindings.d1({
          name: "system-design-chatgpt",
          id: "00000000-0000-0000-0000-000000000001",
        }),
        BUCKET: bindings.r2({
          name: "system-design-chatgpt",
        }),
        // bindings.kv takes only the id; wrangler.jsonc is where the name lives.
        OAUTH_KV: bindings.kv({ id: "00000000000000000000000000000001" }),
        ROOM: bindings.durableObject({
          worker: "system-design-chatgpt",
          exportName: "DiagramRoom",
        }),
        ASSETS: bindings.assets(),
      },
    },
  };
});
