# Agent notes

## Conventions

Use named module-level object/tuple types and kebab-case source filenames; component
exports stay PascalCase. The shared Oxforge preset enforces these conventions.

Before adding a custom script, prefer native commands, declarative config, maintained
plugins or the existing Vitest runner. A repository-specific script must begin with
why native tooling cannot cover it, have a runner test, and quote that justification
in its PR.

Use the existing libraries for their domains: Excalidraw canvas UI/scene operations,
TanStack Query server state, dagre graph layout, Zod + Hono's validator for HTTP input.

## Canvas UI

Before adding canvas chrome, inspect Excalidraw's exports in
`node_modules/@excalidraw/excalidraw/dist/types/excalidraw/index.d.ts` and the adjacent
`types.d.ts` (`ExcalidrawProps`, `ExcalidrawImperativeAPI`, `AppState`).

- Render UI through Excalidraw children/slots so CSS tokens are inside `.excalidraw`.
  Use its theme tokens and existing classes such as `sidebar-trigger`.
- Excalidraw's `Footer` is desktop-only; every footer action also needs a `MainMenu`
  item for mobile.
- The exported `Footer` is `FooterCenter` with no leading margin. Add a `0.6em` gap
  from the undo/redo buttons.

## Tests

- Before adding a test, identify the specific behavior, a credible mistake it should catch, and an independently justified expected result.
- Prefer small, fast, reliable tests whose failures identify the broken behavior. Use integration/E2E tests for interactions isolated tests cannot establish.
- Do not reproduce implementation logic in assertions or mocks.
- Protect contracts, not incidental internal structure.
- Distinguish temporary development scaffolding from checks worth maintaining.
- Never delete or weaken a failing test just to make the suite pass.
