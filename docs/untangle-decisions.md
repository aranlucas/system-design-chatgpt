# Untangle decisions — 2026-11-06

## Baseline and inventory (before edits)

Clean worktree at b6338a6. Read root AGENTS.md (the only repository agent file),
source/module entry points, shared contracts, auth/store/room/scene/layout/view/UI
boundaries, test suite and workflows. Independent read-only inventory review also
covered the repository. Preserve PRs #19–23: native tooling, meaningful test pruning,
consolidated docs and preview cleanup. Both Comments and Tests additions selected.
No owned local tests/builds were running; validation is CI-only throughout.

## Design and fixes

- Put GitHub's upstream exchange, profile validation, PKCE and subject encoding in
  one dependency-light auth module. Keep consent/session state and user-facing error
  presentation in their separate flows.
  - Browser auth and MCP OAuth duplicate endpoints, token/identity schemas, PKCE
    and encoded subjects; ownership depends on them agreeing.
  - OAuth reads GitHub JSON without the browser flow's response size bound.
- Share the workspace library schema between MCP output and the embedded chooser.
  - The same response fields are independently declared in mcp.ts and workspace.ts.
- Give identifiers a small shared module using Web Crypto, preserving URL-safe
  alphabet and lengths. Storage and scene depend on this stable primitive.
  - Storage imports the entire scene engine for newId, including for access keys.
  - Geometry's Math.random helper thereby becomes a credential generator.
- Remove comments that merely narrate declarations and incidental catalog/palette
  assertions after the structural changes; keep behavioral and compatibility tests.

## Retained requirements and rejected churn

- Scene and Canvas share substantial geometry/socket/Excalidraw invariants; splitting
  solely by line count adds navigation without establishing better ownership.
- Scene Op accepts unknown component kinds so it can return per-operation errors;
  MCP's schema restricts the public catalog. The broader engine type and narrower
  input validation have distinct jobs; do not blindly infer one from the other.
- Bounded request and webhook readers deliberately have different errors/limits
  (HTTP 413 vs verification failure). A generic policy callback is not justified.
- Keep webhook backoff/consent rechecks, focused-tab reconnect waits, layout solver
  fallback, optional storage catches, and lazy OAuth loading: these encode external
  constraints. Preserve home-route guards that avoid importing Zod into that bundle.
- Snapshot atomicity/retention and product proposals already documented in
  improvements.md remain separate feature work, not speculative refactor scope.

## Validation and review

Existing CI runs all Vitest behavioral/regression tests, typecheck, lint/format and
build. No local tests, benchmarks, browser tests or builds will be run. Baseline
failures will be distinguished from introduced failures using CI evidence.

New regression checks (CI only): RFC 7636's published S256 vector catches broken
PKCE encoding; a fixed GitHub subject protects ownership namespace compatibility;
malformed identities and oversized responses catch broken boundary validation.
ID generation must still work with Math.random unavailable, protecting the move to
cryptographic entropy without making probabilistic uniqueness assertions. Existing
OAuth and HTTP integration tests continue to exercise consent and browser sessions.
Removed assertions only repeat map construction or freeze incidental hex values;
kept role colors and agent/fill distinction, plus catalog validity and uniqueness.

Fresh sequential post-refactor review: no behavioral defects or remaining worthwhile
structural issues found. It rechecked GitHub ownership/PKCE/callback/header behavior,
ID compatibility, workspace output/consumer agreement, and retained special cases.
Baseline main CI succeeded at b6338a6 (run 41702079307). Local diff whitespace check
and formatting completed; no local tests/builds/typecheck were run. PR CI is the
behavioral validation gate. The standalone formatter used the installed preset's
published options because this clean worktree has no node_modules.
