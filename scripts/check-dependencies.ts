// Keep the Extensions experiment on one MCP SDK generation. Strict installation
// checks the complete peer graph; this guard prevents the old wrapper from returning.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type PackageManifest = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const manifest: PackageManifest = JSON.parse(readFileSync("package.json", "utf8"));

const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };

const lock = readFileSync("pnpm-lock.yaml", "utf8");

const settings = readFileSync("pnpm-workspace.yaml", "utf8");

assert(/^strictPeerDependencies: true$/m.test(settings), "Strict peer checking must stay enabled");

assert(/^autoInstallPeers: false$/m.test(settings), "Peers must not be installed automatically");

assert(/^  autoInstallPeers: false$/m.test(lock), "The lockfile must disable automatic peers");

assert(
  !manifest.peerDependencies || !Object.keys(manifest.peerDependencies).length,
  "This app must not require consumers to supply peers",
);

for (const name of ["@openai/mcp-extensions", "@modelcontextprotocol/sdk"]) {
  assert(!dependencies[name], `Unexpected legacy dependency: ${name}`);
  assert(!lock.includes(`${name}@`), `The lockfile contains ${name}`);
}

for (const name of ["client", "core", "server", "ext-apps"]) {
  const dependency = `@modelcontextprotocol/${name}`;
  assert(dependencies[dependency]?.startsWith("2."), `${dependency} must use MCP v2`);
}

for (const match of lock.matchAll(
  /^  '@modelcontextprotocol\/(client|core|server|ext-apps)@([^']+)':$/gm,
)) {
  assert(match[2].startsWith("2."), `Unexpected MCP generation in lockfile: ${match[0].trim()}`);
}

console.log("Dependency check passed: MCP v2 throughout; no legacy Extensions SDK peers.");
