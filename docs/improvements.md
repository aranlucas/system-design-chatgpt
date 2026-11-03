# Engineering and interview proposals

These are proposals carried forward from the September 2026 design review, not a
committed release order. [ROADMAP.md](../ROADMAP.md) owns the ChatGPT product priorities.
Practice workflows should enter this host only after proving useful in Companion.

## Reliability work

- Make snapshot creation recover from partial R2/D1 failures; changing write order
  cannot make two services atomic. Add retention and paginated history so old versions
  are both manageable and discoverable. Restore already validates stored scenes.
- Make creation/seed retries safe: `createDiagram` validates private-template access
  first, but failures after persistence can still leave artifacts. Define cleanup or
  idempotency before treating retries as duplicate-free.
- Bound pending browser RPCs and define fallback without losing focused-tab semantics.
  Broadcasting a selected screenshot request can capture another person's view.
- Bound model-facing raw scenes by frame or pagination while preserving the complete
  app rendering path. Existing scene-size limits do not establish a useful token budget.
- Cover real Excalidraw screenshot/Mermaid behavior and multi-tab reconnect races.
  Node fakes do not establish Durable Object hibernation or deployed-host behavior.

## Candidate tools

Keep arithmetic deterministic and route opt-in writeback through the room's existing
mutation/snapshot path. These ideas need product evidence before expanding the tool
surface:

| Proposal                                             | Distinct outcome / constraint                                                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `compute_capacity`                                   | Calculate QPS, yearly storage, bandwidth and shards with explicit assumptions; optionally write estimates to the canvas.                  |
| `lint_design`                                        | Return graph-grounded gaps with node IDs and suggested patch operations, such as a disconnected node or missing queue consumer.           |
| `grade_design(level)`                                | Produce a rubric scorecard with evidence; component presence alone is insufficient to grade a design.                                     |
| `gaps`, question bank, `drill_followups(level)`      | Ground level-calibrated follow-ups in the current graph's gaps.                                                                           |
| `compare_options(topic, A, B)`                       | Capture trade-offs as notes when the user requests canvas writeback.                                                                      |
| `trace_path(from, to)`                               | Trace a read/write path and optionally render a sequence diagram through Mermaid.                                                         |
| `inject_failure(target, kind)`                       | Snapshot, mark a failure and explain its blast radius, retaining restore as recovery. Timed failure exercises could use room alarms.      |
| Roles, timed driver, `diff_snapshots`, review export | Support candidate/interviewer/reviewer modes and a review mode that leaves the canvas unchanged. Each workflow should ship independently. |
| Workers AI prose grading / similar-design retrieval  | Consider only after usage and cost evidence justify model/retrieval infrastructure.                                                       |

The earlier engineering sequence proposed capacity and linting first, then evidence-
based grading/follow-ups, then tracing/failure exercises and a timed interview loop.
The host roadmap's board identity/resume acceptance remains the immediate priority.
