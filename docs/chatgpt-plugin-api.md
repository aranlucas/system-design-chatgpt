# ChatGPT Plugin Extensions experiment

This standalone repository implements the
[Plugin Extensions API](https://developers.openai.com/plugins/build/extensions)
directly from its documented protocol. It adds both a sidebar app (`global`
entrypoint) and a conversation panel (`thread` entrypoint). Both open the full
collaborative Excalidraw editor with a diagram chooser.

## Dependency boundary

`@openai/mcp-extensions` 0.1.0 declares peers on MCP Apps ^1.7.5 and
`@modelcontextprotocol/sdk` ^1.29.0. This repository removes that wrapper and
the legacy SDK entirely. It uses MCP Apps 2.0.0 and the MCP client, core, and
server 2.1.0 packages. Protocol version `2026-07-28`, OAuth, and MCP Events remain
available.

The supported subset comes from the
[Extensions protocol at `node-v0.1.0`](https://github.com/openai/mcp-extensions/blob/node-v0.1.0/docs/spec.md):
tool/resource metadata under `openai/ui`, deep links under `openai/deepLink`,
interaction cursors, and the standard MCP Apps `ui/update-model-context` method.
`src/shared/openai-extensions.ts` validates host input and accepts both the
documented `{ url }` deep link and the older `{ path, query }` payload. It has no
runtime SDK dependency. The app does not depend on `window.openai`.

Installs enable `strict-peer-dependencies` and disable `auto-install-peers`.
`pnpm check:deps` and CI prevent the legacy SDK packages from returning. The
application declares no peer dependencies of its own; React and Excalidraw's
normal peer requirements are still present and satisfied. This is an experiment
implementing the protocol subset it needs, not the full Extensions SDK surface.

## What changes

- App-only `open_canvas` advertises both entrypoints under `openai/ui` and has
  no required arguments. Its launch result contains the signed-in user's first
  page of diagrams and can include a validated active share link and name.
- App-only `list_diagrams` provides owner-scoped refresh and pagination. The
  workspace consumes the initial launch result without calling the opener again.
- The workspace offers a chooser and a shared-link form. Shared links are
  verified through `join_session` before navigation. The embedded editor is
  restricted to the deployment's exact origin by validation and `ui.csp.frameDomains`.
- The editor keeps its existing drawing, collaboration, versions, share, and
  component-library controls. **All diagrams** returns to the workspace chooser.
  **Use selection in chat** is a native Excalidraw `MainMenu.Item`; it updates
  model context with the active diagram and selected element IDs without sending
  a chat message when the host supports context updates. Opening a diagram also
  updates model context. Hosts without context support can still use the editor.
- Host theme changes reach the editor through origin- and source-checked
  messages. The workspace reads the documented deep-link host context and uses
  the shared MCP Apps context API when the host advertises support.
- `get_scene` retains the inline SVG preview, refresh, fullscreen polling, and
  **Open canvas** navigation. It also reads Extensions deep links. Images and
  embeds remain placeholders in that preview; the workspace uses the full editor.

The chooser lives outside the drawing surface because Excalidraw's library
contains reusable drawing components, not the server's saved diagrams. Canvas
actions use Excalidraw's existing menu and welcome-screen components.

The workspace declares only fullscreen display mode, which the host uses for
sidebar and conversation-panel placements. The preview supports inline and
fullscreen. Their resource cache keys are
`ui://system-design-canvas/workspace-v1.html` and
`ui://system-design-canvas/diagram-extensions-v1.html`. Both use the standard
`text/html;profile=mcp-app` MIME type and self-contained HTML bundles generated
by `pnpm build:view`.

## Try it

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Run `pnpm check`, `pnpm test`, and `pnpm check:bundle`.
3. Provision this repository's Cloudflare resources and deploy it to a test
   deployment with the GitHub OAuth setup described
   in [setup.md](setup.md). Connect its HTTPS `/mcp` endpoint to a development
   plugin and rescan tools using the
   [connect and test guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).
   A new repository does not update an installed plugin's deployed endpoint.
4. Open **System Design** from the ChatGPT sidebar and from a conversation's
   panel. Confirm both show the chooser, load your diagrams, paginate, and allow
   a valid shared link. An empty library should still offer the shared-link form.
5. Open a board and draw in it. Make an agent edit in chat and a browser edit on
   the same board; verify all three views synchronize. Select components and use
   **Use selection in chat**, then ask ChatGPT to work on those components.
6. Check light/dark themes, narrow layouts, keyboard access, clipboard actions,
   **All diagrams**, and library refresh while a shared board is active. Test an
   invalid or revoked link and a link from a different deployment.
7. Check the inline preview and a deep link containing a URL-encoded `diagram`
   query parameter. Verify MCP Events through the same endpoint; they still
   require MCP `2026-07-28` and configured callback hosts.

Repository tests cover extension metadata, owner isolation, capability checks,
modern and legacy deep links, malformed host input, and editor message boundaries.
Local browser validation used a simulated MCP Apps host with the standalone
MCP v2 workspace and a local Cloudflare Worker/editor. It confirmed launch-result
reuse, URL deep links, theme changes, library refresh/pagination, drawing,
cross-tab synchronization, selection context through the standard MCP Apps
method, returning to the chooser, rejection of foreign-deployment share links,
and a 390px viewport. The host did not advertise the experimental
OpenAI model-context capability, so this also checked that the standard bridge
was sufficient.

A deployed development plugin in ChatGPT is still needed to confirm entrypoint
discovery, account availability, OAuth, and nested-frame CSP enforcement. No
production deployment is part of this experiment.
