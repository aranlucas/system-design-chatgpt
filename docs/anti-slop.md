# Anti-slop enforcement

The repository vendors the complete `src/` tree of
[dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) at
`c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`, under
`tools/oxlint/anti-slop/`. The upstream MIT license and nested Stylistic
license/provenance are retained. This includes the upstream generic and Effect
rule tests, even though this application has no direct Effect dependency and
therefore enables no Effect-specific rules. There is no official anti-slop npm
package; the plugin is loaded directly from the vendored entry point.

All 18 generic rules and `oxc/no-accumulating-spread` are errors. The existing
local named-type and filename rules, type-aware checking, warning limit,
unused-suppression checking, and CI checks remain enabled. Oxlint and
`@oxlint/plugins` are pinned together at 1.85.0, the previous resolved Oxlint
version. The declared package manager stays pnpm 12.6.0; unrelated dependency
resolutions are unchanged. Existing CI runs check, unit tests, scene smoke,
production builds and bundle budgets. Vendored tests are outside application
Vitest's existing `tests/**/*.test.ts` discovery and can run independently.

## Contracts and narrow exceptions

- `src/shared/protocol.ts`: the existing `El` extension index remains opaque.
  Its pre-existing `any` value type is retained, rather than changing this
  public Excalidraw wire contract. One line exempts that index from the unsafe
  dictionary rule. Named core fields, including the optional string/null index,
  are validated before use. The schema returns the original element and retains
  extension identity and own `__proto__`, `constructor`, and `prototype` keys.
  Round-trip and malformed-core tests cover this boundary. RPC messages now use
  explicit method-specific parameter unions instead of the former `any` params.
- The runtime-typeof rule's upstream `allowInTypeGuards` option is enabled only
  in `src/worker/room.ts`, `src/app/validation.ts`, and the strict fake / awaited
  RPC test adapters. These guards establish concrete contracts. The WebSocket
  string/ArrayBuffer distinction uses typeof so cross-realm buffers remain binary.
  Small validated frontend guards preserve the existing Home bundle budget;
  shared/canvas schemas use the installed Zod Mini entry point.
- Remaining assertions document concrete owners: server-written WebSocket
  attachments; Excalidraw importer/normalizer and nominal brands; caller-selected
  KV/D1/R2 API results; and explicit test adapters. They are not validation claims.
  The strict fake returns typed supplied members or throws on unsupported access.
  The awaited RPC adapter derives methods from the actual DiagramRoom owner;
  unsupported pipelining and disposal fail closed. Ordinary R2 data explicitly
  permits a missing `then` probe; missing Promise methods still throw.
- The former MCP App module mock is replaced by a real App instance passed into
  the view host, with scoped method spies. The existing Node Cloudflare runtime
  adapter is retained; no new module aliases hide a mock.

The ChatGPT fork keeps its own OpenAI Extensions metadata, embedded editor,
request routing headers, authentication identifiers, dependency pins, and
navigation/race handling. Companion's unrelated workspace redesign and creation
transaction changes were not copied. Router/layout algorithms are unchanged.
Public `shape` property names remain unchanged and quoted; the formatter keeps
those quotes. Conditional property omission is retained.

## Verification

Local project types, all lint rules, unit tests, scene smoke, dependency-version
checks, production build, and existing bundle budgets pass. Home JavaScript is
approximately 266 kB against the unchanged 300 kB limit; all Worker chunks total
approximately 650 kB against the unchanged 700 kB limit. The full test suite
includes OpenAI host/navigation, embedded canvas, OAuth, publishing access,
webhooks, scene operations, real adapter contracts, and wire-extension tests.

Rendered local browser verification could not run because the cloud browser
returned `ERR_BLOCKED_BY_CLIENT`; that restriction was not bypassed. No real
user data, production API calls, credentials, or manual deployment were used.
