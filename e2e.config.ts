import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";

export default {
  tests: "e2e/**/*.e2e.ts",
  targets: [
    {
      name: "chromium",
      engine: web(),
      app: {
        url: "http://127.0.0.1:4173",
        command: {
          executable: "pnpm",
          args: [
            "exec",
            "vite",
            "preview",
            "--host",
            "127.0.0.1",
            "--port",
            "4173",
            "--strictPort",
          ],
          log: ".e2e/logs/app.log",
        },
      },
    },
  ],
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporters: ["list", "junit"],
} satisfies E2EConfig;
