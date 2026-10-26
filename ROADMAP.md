# System Design for ChatGPT feature roadmap

Updated 2026-10-26. Proposed release order, not delivery dates or evidence of customer demand. Targets below are pilot decision gates, not measured results.

## User and outcome

A ChatGPT user who wants the diagram and conversation to remain in sync through a complete architecture discussion.

## Current baseline

This experiment already embeds a collaborative Excalidraw editor in ChatGPT sidebar/conversation surfaces and implements the extension protocol alongside MCP. Its value is the host-integrated journey, not a second independent canvas engine.

Planning evidence: [README](README.md) and [host integration notes](docs/chatgpt-plugin-api.md) at `08a2e5f6e1ca`. This focused product pass does not claim a complete new code audit or live-provider validation.

## Prioritized releases

| Order | Feature                                          | User value and scope                                                                                                                   | Release acceptance                                                                                                     |
| ----- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Now   | Resume the right board in the right conversation | Make board selection, reconnect and “continue this design” explicit across the sidebar and conversation surface.                       | A returning user sees which board is active, restores the intended context and cannot silently edit a different board. |
| Next  | Review proposed design changes in context        | Present a concise component/connection change preview before a substantial agent edit, with an accessible accept/reject and undo path. | A user can compare the proposed trade-off, apply it once and restore the earlier checkpoint.                           |
| Next  | Turn a discussion into a design brief            | Export an approved diagram plus assumptions, decisions, alternatives and unresolved questions from the session.                        | The brief identifies which claims came from the user or the model and includes links to the relevant board/version.    |
| Later | Bring proven practice workflows into the host    | Adapt the Companion session recap/drills only after their usefulness is demonstrated there.                                            | Host-native start, pause, resume and export work end to end without duplicating the core interview engine.             |

## Measure value before expanding

Measure time from opening the extension to a useful board edit, wrong-board/confusion incidents, reconnect recovery and brief export use. Proposed first gate: five observed start/resume journeys finish without manual URL repair or an unintended edit.

Collect the baseline before building the first slice. Use voluntary pilot feedback and minimal aggregate events; do not log private content or credentials to measure adoption. If the first workflow is not used again, revisit the problem before adding the later features. Revenue impact is unvalidated.

## Next shippable slice

Ship the board/conversation identity and resume journey, then test it in the supported host before adding more tools.

## Dependencies and deliberate limits

Treat extension availability and host behavior as release prerequisites to verify, not guarantees from local tests. Keep the share-link capability boundary explicit; do not imply invitation-only collaboration already exists.

Engineering work belongs in the milestone only when it enables that acceptance criterion. Prefer existing native libraries and test runners. Update this roadmap when a user-visible increment ships, recording the outcome and remaining limits rather than checking off implementation activity alone.
