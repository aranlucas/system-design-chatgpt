# Correctness and reliability audit — 2026-11-06

## Scope and baseline

Fresh behavior audit at remote default `2519a0fd931114ee408cd04c43303a0643ff046d`
(after merged untangle PR #24). Clean isolated worktree; no structural cleanup.
Tests and builds run exclusively in CI. Static inspection is not execution evidence.

## Inventory and boundaries

- Browser: GitHub sign-in/session/logout, private paginated library, create from
  built-in/private templates, capability-link editor, rename, versions/restore,
  image upload/download, collaborative reconnection and embedded-host messaging.
- HTTP: Hono validators, same-origin cookie mutations, owner-only deletion,
  capability gates for files/versions/sockets, bounded bodies and atomic budgets.
- MCP/OAuth: read/write scopes, PKCE/state and grant identities, stateless tools,
  workspace/preview resources, tab RPC, events and signed callback delivery.
- Persistence: D1 owners/library/subscriptions, per-room SQLite scene/tombstones,
  R2 files/templates/versions, KV login/session/grants. Cross-store operations are
  not transactions; deletion revokes first and retains authenticated retry state.
- Scene engine: operations, partial-batch results, restore versions, geometry,
  dagre layout and template conversion. Existing scene and protocol tests retained.
- External boundaries: GitHub token/identity requests, allowlisted public webhook
  destinations, ChatGPT/MCP host adapters. CI fixtures must not use production data.

## Confirmed findings (before implementation)

1. **Medium, high confidence — library-link event subscriptions never deliver.**
   `store.ts:listDiagrams/verifyKey` creates and accepts an additional library
   capability. `events.ts:subscribe` hashes that accepted key, but
   `activeSubscription` compares only the original `diagrams.key_hash`. Trigger:
   list one's boards, subscribe using the returned link, then rename/edit. Actual:
   grant succeeds, first delivery deletes the subscription. Expected: either valid
   capability authorizes delivery until it is revoked, with consent still checked.
   Regression: subscribe with a real generated library link, deliver, revoke that
   library key, and establish that later delivery stops. Keep original-key checks.
2. **Medium, high confidence — duplicate socket IDs can roll scene versions back.**
   `room.ts:webSocketMessage` compares every array entry with pre-message storage,
   then persists all accepted entries in order. Trigger: same ID at v3 then v2
   when stored at v1 (also equal-version nonce conflicts). Actual: v2 persists and
   duplicate IDs broadcast; expected documented merge winner, v3, independent of
   array order. Regression: assert live scene, persisted SQLite and broadcast
   contain only the winning revision for both versions and nonce tie-breaks.

3. **Medium, high confidence — missing socket frames are not retried after reconnect.**
   Independent review traced `canvas.tsx:flush/init`: sending records a version,
   but reconnect init does not remove receipts for IDs absent on the server.
   Trigger: new local element sent just as the connection drops, then an empty
   server init. Actual: element remains visible but flush skips it; reload loses
   it. Expected: resend local elements absent from the authoritative receipt.
   Fix clears receipts before populating init. Deterministic browser regression
   drives the real editor through a controlled lost-frame/repeated-init transport.

## Rejected hypotheses and existing protections

- Shared-link editing without sign-in is intentional, documented capability access.
- Library/host access does not imply ownership: owner-only deletion/template save
  and private template cloning already enforce it; legacy boards are not claimed.
- Tidy/layout/patch snapshot awaits do not commit stale scene copies: scenes are
  rebuilt after awaits (tidy reruns when edits changed). Restore intentionally
  replaces current state and takes a safety checkpoint first.
- Snapshot/file deletion races have tombstones, room deactivation and post-write
  cleanup checks; cross-store orphan risk on process failure is documented.
- Webhooks already bound retries/timeouts, retain event IDs, reject redirects,
  recheck consent/expiry, and cancel bodies. Best-effort/no replay is intentional.
- Host messages check source/origin and schema; cross-origin frame navigation is
  validated. Opaque Excalidraw extension fields are intentional compatibility data.
- GitHub responses are bounded and timed; schema-init failures evict cached errors.

## Framework and validation plan

Published npm metadata checked: real `e2e` 0.23.0 (tester-army/e2e), web engine
0.15.5; both require Node ^22.22.3 or >=24.8.0. Read current quickstart, CI,
GitHub Actions, web and browser docs and published package types. Use deterministic
web flows with no models/credentials. Preserve existing Vitest/build CI gates;
add CI-only pre-fix reproductions and meaningful browser journeys. Browser API
fixtures prove frontend contracts only; protocol regressions exercise real MCP
handlers and room storage. Live GitHub/ChatGPT compatibility remains outside CI.

## Evidence and outcome

Implemented all three findings without API changes. Independent review confirmed
both initial findings and found the reconnect defect plus shallow-checkout CI
setup, both addressed. Real e2e 0.23.0 + web 0.15.5 are lockfile-pinned. Browser
journeys cover real unsigned Worker rejection, fixture-backed delete cancel/fail/
retry/logout, and editor lost-frame recovery. No model calls or secrets required.
Published installed e2e guide and setup/writing-tests/running references read.
Local installation used --ignore-scripts; only formatting/static lint performed.
CI execution evidence pending; no local tests or builds run.

### CI follow-up

Run 42307611763 passed existing CI (tests/typecheck/lint/build) and the isolated
room/events pre-fix assertion checks. Browser startup failed before tests:
Cloudflare Vite dev module runner could not resolve existing `oauth-paths.ts`.
Browser CI now builds baseline/fixed versions and uses the plugin's bundled
`vite preview` path; this validates the built app without the dev module runner.
No browser pass is claimed from that failed run.
