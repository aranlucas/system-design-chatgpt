import { bindings, defineConfig, exports } from "cf/config";

import { RUN_WORKER_FIRST } from "./src/worker/oauth-paths.ts";

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
            id: "c30f0c8e-3349-42c4-a976-e3e5601cd295",
          }),
          BUCKET: bindings.r2({
            name: "system-design-chatgpt-preview",
          }),
          // bindings.kv takes only the id; wrangler.jsonc is where the name lives.
          OAUTH_KV: bindings.kv({ id: "0826131f4f664cc4a793411a263ef106" }),
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
          id: "44457e48-2445-4405-abc3-f5b514c6bee5",
        }),
        BUCKET: bindings.r2({
          name: "system-design-chatgpt",
        }),
        // bindings.kv takes only the id; wrangler.jsonc is where the name lives.
        OAUTH_KV: bindings.kv({ id: "ef2283e33e7d45398b5dc7db2a212e6e" }),
        ROOM: bindings.durableObject({
          worker: "system-design-chatgpt",
          exportName: "DiagramRoom",
        }),
        ASSETS: bindings.assets(),
      },
    },
  };
});
