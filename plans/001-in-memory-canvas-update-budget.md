# Plan 001: Ordinary drawing never disconnects a canvas tab

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat cecd0eb..HEAD -- src/worker/room.ts src/worker/request-limits.ts test/room.test.ts docs/design.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `cecd0eb`, 2026-11-11

## Why this matters

The browser canvas flushes local changes every 60 ms while anything is dragged,
resized or drawn freehand, which is about 16 updates per second. The room admits only
240 updates per minute **per board**, shared by every tab, and then closes the sender
with 1013. About 15 s of continuous drawing in a minute crosses that, and two
collaborators cross it in about 7 s. partysocket reconnects on 1013, the tab re-sends,
and the room closes it again until the minute window rolls over. Meanwhile the tab
shows "Offline, reconnecting…" and peers stop seeing edits. Every canvas message also
awaits a D1 upsert before it is applied, so a D1 outage disconnects every editing tab,
even though the scene lives in the room's own SQLite.

## Current state

- `src/app/canvas.tsx:861-863`: the client flush cadence.
  ```ts
  const scheduleSend = () => {
    pendingSend.current ??= window.setTimeout(flush, 60);
  };
  ```
- `src/app/canvas.tsx:524`: `shouldReconnectOnClose: (event) => event.code !== 1008`. A 1013 close reconnects.
- `src/worker/room.ts:448-459` (inside `async webSocketMessage`):
  ```ts
  case "update": {
    try {
      await takeBudget(this.env, `board-update:${this.diagramId}`, 240);
    } catch {
      ws.close(1013, "Too many canvas updates");
      return;
    }
    if (this.deleted) {
      return;
    }
  ```
- `src/worker/request-limits.ts:57-72`: `takeBudget` is a D1 fixed window (`CREATE TABLE IF NOT EXISTS` plus an upsert, so two round trips). It stays in use by the stateless Worker routes (`index.ts:129`, `mcp.ts:41`, `store.ts:309`, `browser-auth.ts:70`), where cross-isolate consistency is genuinely needed.
- Convention: Durable Object methods that are synchronous internally return `promiseResult(() => ...)` (`src/shared/promise-result.ts`). See `rename` and `init` in `room.ts`.

## Commands you will need

| Purpose   | Command                               | Expected on success |
| --------- | ------------------------------------- | ------------------- |
| Install   | `pnpm install --frozen-lockfile`      | exit 0              |
| Typecheck | `pnpm typecheck`                      | exit 0              |
| Lint      | `pnpm lint && pnpm format:check`      | exit 0              |
| Tests     | `pnpm exec vitest run --maxWorkers=1` | all pass            |
| Build     | `pnpm build`                          | exit 0              |

## Scope

**In scope**: `src/worker/room.ts`, `src/worker/request-limits.ts`, `test/room.test.ts`, `docs/design.md`.

**Out of scope**: `src/app/canvas.tsx` (the client cadence is correct; the server
limit is what's wrong), `takeBudget` and its HTTP/MCP callers, and close-code
semantics (plan 004).

## Steps

1. Add the tests below to `test/room.test.ts` and confirm that, apart from the
   board-ceiling test, they fail on the current code. That establishes the regression.
2. In `request-limits.ts`, add a continuous-refill `TokenBucket` class plus two
   rates: `SOCKET_UPDATE_RATE = { perSecond: 20, burst: 100 }`, which sits above the
   client's ~16.7/s, and `ROOM_UPDATE_RATE = { perSecond: 60, burst: 300 }`, which
   keeps a per-board ceiling.
3. In `room.ts`, keep one room bucket and a `WeakMap<WebSocket, TokenBucket>`. Spend
   the socket's bucket first, then the room's, so a flooding tab drains its own
   allowance first. Replace the `takeBudget` call. Make `webSocketMessage` return
   `promiseResult(() => this.handleSocketMessage(ws, raw))`. Once no await remains,
   drop the after-await `deleted` re-check.
4. Add one paragraph to `docs/design.md` under "Edits and sync".

**Verify**: `pnpm exec vitest run test/room.test.ts -t "canvas update budget" --maxWorkers=1` → 5 passed.

## Test plan (`test/room.test.ts`, "canvas update budget")

Use `vi.useFakeTimers({ toFake: ["Date"] })` and advance 60 ms per flush:

- One tab sends 1000 updates at 60 ms (one minute): it is never closed and the final version persists.
- Two tabs interleave 500 updates each at 60 ms: neither is closed.
- A tab sends 1000 updates with no time passing: it is closed with `1013`. A collaborator's next update is still accepted.
- Ten tabs each burst 50 updates: at least one gets `1013`. This passes before and after the change, on purpose: it guards the per-board intent.
- `env.DB.prepare` throws: the update persists, is broadcast, and the sender stays open.

## Done criteria

- [ ] All five commands in the table pass
- [ ] `grep -n "board-update" src/worker/room.ts` returns nothing
- [ ] `plans/README.md` row updated

## STOP conditions

- The client flush interval in `canvas.tsx` is no longer 60 ms. The rates must then be re-derived.
- `webSocketMessage` gained another `await`. Then the `deleted` re-check after it must stay.

## Maintenance notes

- If the client throttle changes, keep `SOCKET_UPDATE_RATE.perSecond` above `1000 / interval`.
- Hibernation drops the buckets. That's fine: a room only hibernates while idle, and a fresh burst is then appropriate.
- CI's `regression-reproduction` job swaps `room.ts` back to `2519a0f`, which still imports `takeBudget`. Keep that export.
