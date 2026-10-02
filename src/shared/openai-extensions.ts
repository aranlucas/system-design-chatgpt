import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";

// The subset used here follows OpenAI's node-v0.1.0 protocol specification:
// https://github.com/openai/mcp-extensions/blob/node-v0.1.0/docs/spec.md
// These are wire metadata and host-context fields, independent of its v1 SDK wrapper.
type ChatGptDisplayMode = "inline" | "fullscreen";
type NavigationEntrypoint = { type: "global" | "thread" };
export type OpenAIUiToolMetadata = {
  entrypoints?: NavigationEntrypoint[];
  preferredModelDisplayMode?: ChatGptDisplayMode;
};
export type OpenAIUiResourceMetadata = {
  availableDisplayModes?: ChatGptDisplayMode[];
  preferredDisplayMode?: ChatGptDisplayMode;
};
type DeepLinkCandidate = { url?: unknown; path?: unknown; query?: unknown };
type LegacyQueryPair = [string, string];
type CursorPreference = "default" | "pointer";

function isQueryPair(value: unknown): value is LegacyQueryPair {
  return (
    Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "string")
  );
}

/** Read the documented URL payload and accept the older installed-host representation. */
export function deepLinkUrl(context: McpUiHostContext | undefined): string | undefined {
  const state = context?.["openai/deepLink"];
  if (!state || typeof state !== "object") return undefined;
  const candidate = state as DeepLinkCandidate;
  if (typeof candidate.url === "string") return candidate.url;
  if (
    !Array.isArray(candidate.path) ||
    !candidate.path.every((segment) => typeof segment === "string") ||
    !Array.isArray(candidate.query) ||
    !candidate.query.every(isQueryPair)
  )
    return undefined;
  try {
    const path = candidate.path.map(encodeURIComponent).join("/");
    const search = new URLSearchParams(candidate.query).toString();
    return `/${path}${search ? `?${search}` : ""}`;
  } catch {
    return undefined;
  }
}

export function interactionCursor(context: McpUiHostContext): CursorPreference {
  return context["openai/interactionCursor"] === "default" ? "default" : "pointer";
}
