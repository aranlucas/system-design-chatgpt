# Plan 004: Only a deleted board stops a tab from reconnecting

> **Executor instructions**: Follow this plan step by step and verify each step.
> On a STOP condition, stop and report. When done, update this plan's row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat cecd0eb..HEAD -- src/worker/room.ts src/app/canvas.tsx src/worker/socket-schema.ts test/room.test.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 001 (same `webSocketMessage` code)
- **Category**: bug
- **Planned at**: commit `cecd0eb`, 2026-11-11

## Why this matters

The client treats close code 1008 as "diagram deleted": it stops reconnecting and
shows no offline toast. The room, however, also closes with 1008 for any invalid
message and when the element limit is reached. One realistic trigger: a Mermaid
parse error longer than 1000 characters, which the tab sends back as an
`rpc_result.error`, fails `socketMessageSchema` (`error: z.string().max(1000)`). The
user's tab then silently stops syncing until they reload.

## Current state

- `src/worker/room.ts:321`: `ws.close(1008, "Diagram deleted")`. This is the intended use.
- `src/worker/room.ts` (`webSocketMessage`): `ws.close(1008, "Invalid canvas message")` and `ws.close(1008, "Diagram element limit reached")`.
- `src/app/canvas.tsx:524`: `shouldReconnectOnClose: (event) => event.code !== 1008`.
- `src/app/canvas.tsx:538`: `if (event.code === 1008 || offline.current) return;`, so no toast either.
- `src/app/canvas.tsx:512`: `error: errorMessage(e)` is not truncated.
- `src/worker/socket-schema.ts`: `error: z.string().max(1000).optional()`.

## Approach

Use an application close code (4000–4999) such as `4400 "Invalid canvas message"`
and `4413 "Diagram element limit reached"`. On these, the client shows a toast
explaining the problem. For the element limit it does not retry blindly. For an
invalid message it reconnects once. Truncate `rpc_result.error` to 1000 characters
on the client. Keep 1008 for deletion only.

## Test plan

- `test/room.test.ts`: an invalid frame closes with the new code, not 1008. The element-limit close also uses its new code.
- `e2e/reconnect.e2e.ts` pattern: optionally, a browser check that a 4400 close shows the toast and reconnects.

## Done criteria

- [ ] `grep -n "close(1008" src/worker/room.ts` matches only the deletion path
- [ ] All repo gates pass

## STOP conditions

- ChatGPT's embedded host or the e2e fixtures depend on 1008 for anything other than deletion.
