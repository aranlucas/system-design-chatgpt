import { z } from "zod/mini";
// Keep the Extensions experiment on one MCP SDK generation. Strict installation
// checks the complete peer graph; this guard prevents the old wrapper from returning.
import { assert, test } from "vitest";
import { readFileSync } from "node:fs";

test("keeps strict dependency resolution on the MCP v2 package generation", () => {
  const manifest = z
    .object({
      dependencies: z.record(z.string(), z.string()),
      devDependencies: z.record(z.string(), z.string()),
      peerDependencies: z.optional(z.record(z.string(), z.string())),
    })
    .parse(JSON.parse(readFileSync("package.json", "utf8")));

  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };

  const lock = readFileSync("pnpm-lock.yaml", "utf8");

  const settings = readFileSync("pnpm-workspace.yaml", "utf8");

  assert.ok(
    /^strictPeerDependencies: true$/m.test(settings),
    "Strict peer checking must stay enabled",
  );

  assert.ok(
    /^autoInstallPeers: false$/m.test(settings),
    "Peers must not be installed automatically",
  );

  assert.ok(/^  autoInstallPeers: false$/m.test(lock), "The lockfile must disable automatic peers");

  assert.ok(
    !manifest.peerDependencies || !Object.keys(manifest.peerDependencies).length,
    "This app must not require consumers to supply peers",
  );

  for (const name of ["@openai/mcp-extensions", "@modelcontextprotocol/sdk"]) {
    assert.ok(!dependencies[name], `Unexpected legacy dependency: ${name}`);
    assert.ok(!lock.includes(`${name}@`), `The lockfile contains ${name}`);
  }

  for (const name of ["client", "core", "server", "ext-apps"]) {
    const dependency = `@modelcontextprotocol/${name}`;
    assert.ok(dependencies[dependency]?.startsWith("2."), `${dependency} must use MCP v2`);
  }

  for (const match of lock.matchAll(
    /^  '@modelcontextprotocol\/(client|core|server|ext-apps)@([^']+)':$/gm,
  )) {
    assert.ok(
      match[2].startsWith("2."),
      `Unexpected MCP generation in lockfile: ${match[0].trim()}`,
    );
  }
});
