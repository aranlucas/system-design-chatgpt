# Plan 002: Coalesce `diagram.changed` events from human drawing

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On a
> STOP condition, stop and report. When done, update this plan's row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat cecd0eb..HEAD -- src/worker/room.ts src/worker/events.ts test/room.test.ts test/mcp-events.test.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (it changes event timing that subscribers observe)
- **Depends on**: 001 (it touches the same `update` branch)
- **Category**: perf / bug
- **Planned at**: commit `cecd0eb`, 2026-11-11

## Why this matters

Each accepted human socket update calls `emit("diagram.changed")`, so a dragging tab
emits about 16 events per second. Each emit runs `deliverDiagramEvent`, which queries
D1 for subscriptions, even when there are none, and POSTs a signed webhook with up to
3 attempts to every subscriber. The event description tells ChatGPT to "Call get_scene
with the same share link to see what changed". A ten-second drag can therefore prompt
~160 agent wake-ups, and every canvas flush costs a D1 read.

## Current state

- `src/worker/room.ts:485-496`: the `update` branch persists, broadcasts and then calls `this.emit("diagram.changed", { diagram_id, origin: "human", changed_count: accepted.length })`.
- `src/worker/room.ts:294-301`: `emit` runs `deliverDiagramEvent` in `ctx.waitUntil`.
- `src/worker/events.ts:416-444`: `deliverDiagramEvent` → `subscriptionsFor` (a D1 `SELECT` on every call) → `sendWithBackoff` for each subscriber.
- `src/worker/events.ts:154-163`: the payload schema `{ diagram_id, origin, changed_count }` says "Elements this edit touched."
- The room does not use alarms yet (`grep -n alarm src/worker` returns nothing).

## Approach

Debounce human-origin `diagram.changed` per room with a trailing window, e.g. 2 s,
using `ctx.storage.setAlarm` so the debounce survives hibernation. Accumulate the
**distinct** changed element IDs, so `changed_count` stays "elements touched", in an
in-memory `Set` mirrored to a `meta` row. In `alarm()`, emit once and clear. Agent
and system commits keep emitting immediately: they are already one per tool call.
Document the window in the event description and in `docs/design.md`.

## Scope

**In scope**: `src/worker/room.ts`, `test/room.test.ts`, `test/mcp-events.test.ts`, `docs/design.md`, and the `diagram.changed` description in `src/worker/events.ts`.
**Out of scope**: the webhook signing and retry logic, and the subscription storage.

## Test plan

- 50 human updates within the window produce exactly one `deliverDiagramEvent` call whose `changed_count` equals the number of distinct IDs. Spy on delivery through the existing `mcp-events.test.ts` harness.
- An update after the window has elapsed produces a second event.
- An agent `applyPatch` still emits immediately.
- Deleting the room while an alarm is pending emits nothing.

## Done criteria

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm exec vitest run --maxWorkers=1` and `pnpm build` all exit 0
- [ ] The new tests fail when the debounce is removed

## STOP conditions

- The fake Durable Object context (`test/helpers/fakes.ts:makeRoomCtx`) cannot model `setAlarm`/`alarm` without large changes. Report back rather than adding a timer-based fallback that hibernation would drop.
- An existing subscriber contract in the docs promises one event per edit.

## Maintenance notes

The debounce window bounds how quickly ChatGPT learns of human edits. Review it
alongside the ROADMAP "resume" work.
