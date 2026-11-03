# ChatGPT Plugin Extensions

## Compatibility boundary

This repository implements the Extensions protocol subset directly alongside MCP v2.
The Extensions wrapper was removed because its MCP v1 peer requirements conflicted
with this stack. Current package versions and strict peer policy live in
`package.json` and `pnpm-workspace.yaml`.

The adapter follows the
[Extensions protocol at `node-v0.1.0`](https://github.com/openai/mcp-extensions/blob/node-v0.1.0/docs/spec.md):
`openai/ui` metadata, `openai/deepLink`, interaction cursors and MCP Apps
`ui/update-model-context`. `src/shared/openai-extensions.ts` validates both documented
`{ url }` and legacy `{ path, query }` deep links. It has no runtime Extensions SDK
or `window.openai` dependency; it does not implement the full SDK surface.

`open_canvas` is app-only and advertises sidebar (`global`) and conversation (`thread`)
entrypoints. Its launch result hydrates the owner-scoped chooser; the workspace must
not call the opener again for hydration. `list_diagrams` refreshes/paginates it.
Shared links pass `join_session` validation before navigation. The editor frame is
restricted to the deployment's exact origin by URL validation and resource CSP.

The chooser sits outside the drawing surface because Excalidraw's library is for
reusable artwork. Editor actions use Excalidraw menus. **All diagrams** returns to
the chooser. **Use selection in chat** attaches diagram/selection context through the
standard MCP Apps bridge when supported, without sending a chat message. Origin-
and source-checked messages carry theme and selection between workspace and editor.

The workspace resource is `ui://system-design-canvas/workspace-v1.html`; the inline
preview is `ui://system-design-canvas/diagram-extensions-v1.html`. Both are
`text/html;profile=mcp-app` bundles from `pnpm build:view`. The workspace advertises
fullscreen; the preview supports inline/fullscreen. Preview images and embeds remain
placeholders; the workspace loads the full editor.

## Host acceptance checks

Use a test deployment with [GitHub OAuth configured](setup.md#github-oauth). Connect
its HTTPS `/mcp` endpoint to the development plugin and rescan. Creating a repository
or running local tests does not change an installed plugin's endpoint.

- Open both sidebar and conversation entrypoints. Check chooser hydration, pagination,
  refresh, an empty library and shared-link access.
- Open a board, make browser and agent edits, and confirm synchronization. Select
  components, use **Use selection in chat**, and ask the model to act on them.
- Check theme changes, keyboard access, narrow layouts, clipboard actions, and
  **All diagrams**. A host without context updates must still allow drawing.
- Check a deep link with a URL-encoded `diagram` query parameter, malformed input,
  a revoked link and a foreign-deployment link. Foreign origins must be rejected
  before tool calls or frame navigation.
- Check inline preview refresh/fullscreen and [MCP Events](setup.md#mcp-events).

Tests in `test/openai-extensions.test.ts`, `test/embedded-canvas.test.ts`,
`test/view-host.test.ts` and `test/publishing-access.test.ts` cover local metadata,
validation and access boundaries. A deployed ChatGPT development plugin is still
needed to establish entrypoint discovery, account availability, real OAuth and
nested-frame CSP behavior. See [public release gates](openai-plugin-readiness.md)
for packaging and reviewer preparation.
