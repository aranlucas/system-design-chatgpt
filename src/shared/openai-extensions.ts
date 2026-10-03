import { z } from "zod";
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

type CursorPreference = "default" | "pointer";

const directLinkSchema = z.object({ url: z.string() });

const legacyLinkSchema = z.object({
  path: z.array(z.string()),
  query: z.array(z.tuple([z.string(), z.string()])),
});

/** Read the documented URL payload and accept the older installed-host representation. */
export function deepLinkUrl(context: McpUiHostContext | undefined): string | undefined {
  const state = context?.["openai/deepLink"];

  const direct = directLinkSchema.safeParse(state);

  if (direct.success) return direct.data.url;
  const legacy = legacyLinkSchema.safeParse(state);

  if (!legacy.success) return undefined;
  const candidate = legacy.data;

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
