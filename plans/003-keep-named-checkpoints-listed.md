# Plan 003: Named checkpoints stay restorable after many agent edits

> **Executor instructions**: Follow this plan step by step and verify each step.
> On a STOP condition, stop and report. When done, update this plan's row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat cecd0eb..HEAD -- src/worker/room.ts src/worker/index.ts src/worker/mcp.ts src/app/canvas.tsx test/room.test.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `cecd0eb`, 2026-11-11

## Why this matters

Every agent `apply_patch`, tidy, layout and Mermaid import writes an `auto` snapshot.
`listSnapshots` returns only the newest 30 rows, auto and named mixed together. After
about 30 agent edits, a checkpoint the user deliberately saved drops out of both the
**Versions** panel and the MCP `list_versions` result, so it can no longer be
restored from either surface. Snapshot rows and R2 objects also grow without bound;
`docs/improvements.md` already lists "add retention and paginated history".

## Current state

- `src/worker/room.ts:824-832`: `listSnapshots(limit = 30)` runs `... WHERE diagram_id = ? ORDER BY created_at DESC LIMIT ?`.
- `src/worker/room.ts:691-695`: `applyPatch` auto-snapshots on every agent patch.
- Callers: `src/worker/index.ts:177` (the HTTP Versions route) and `src/worker/mcp.ts:713` (MCP).
- `src/app/canvas.tsx:1299-1306`: the Versions panel query.

## Approach

Return every `named` snapshot plus the newest N `auto` snapshots, using two queries
or a `UNION`, ordered by `created_at DESC`. Add retention: after writing an `auto`
snapshot, delete auto rows beyond a fixed cap (e.g. 50), removing R2 first and then
the D1 row, and tolerate an R2 object that is already gone. Do not prune `named`
snapshots.

## Test plan (`test/room.test.ts`)

- Take a named checkpoint, run 40 agent `applyPatch` calls, then check that `listSnapshots()` still contains the named checkpoint and `restore(id)` succeeds.
- After 60 agent patches, the auto rows in fake D1 and the R2 objects are capped at the retention limit.

## Done criteria

- [ ] All repo gates pass (`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm exec vitest run --maxWorkers=1`, `pnpm build`)
- [ ] The new tests fail on `cecd0eb`

## STOP conditions

- The `snapshots` table schema in `store.ts:ensureSchema` lacks a `kind` column.
- Product docs promise that every auto version is retained.
