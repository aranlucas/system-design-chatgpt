# MCP result compatibility

Model-facing data tools in `src/worker/mcp.ts` return a human summary and serialized
JSON in `content`, plus the same data in `structuredContent`. Keep the full text
fallback: scene IDs, per-operation results, and snapshot IDs must survive clients
that consume only text. Returning both channels can increase model context usage.

Array results use named object fields (`elements`, `snapshots`, `templates`) so the
structured value is self-describing. Keep important interpretation alongside the
data rather than relying on a host to expose a separate prose block.

App-only tools serve a different reader. `render_scene` returns
`{ name, url, elements }` for the preview; `open_canvas` and `list_diagrams` return
the workspace library. Their short text summaries do not duplicate the UI payload.
Screenshots use native image content.

`render_scene` and the workspace tools declare output schemas. Most model-facing
tools do not; Zod input validation does not validate their output contracts. Add
output schemas if callers need discoverable validation rather than assuming the
presence of `structuredContent` supplies it.

The original compatibility decision was informed by the
[MCP structured-content specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#structured-content)
and [MCP Apps data-passing specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx#data-passing).
Retest the intended hosts before removing the explicit text fallback; host behavior
can differ from the protocol's channel semantics.
