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

Implementation, independent review and CI results pending.
