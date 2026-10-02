import { describe, expect, it } from "vitest";
import { deepLinkUrl, interactionCursor } from "../src/shared/openai-extensions.ts";

describe("OpenAI Extensions host context", () => {
  it("receives the protocol's app-relative URL without rewriting its query", () => {
    expect(
      deepLinkUrl({
        "openai/deepLink": {
          url: "/?diagram=https%3A%2F%2Fdesign.example%2Fd%2Fboard123%3Fk%3Dkey",
        },
      }),
    ).toBe("/?diagram=https%3A%2F%2Fdesign.example%2Fd%2Fboard123%3Fk%3Dkey");
  });

  it("normalizes installed hosts' legacy path and query safely", () => {
    expect(
      deepLinkUrl({
        "openai/deepLink": {
          path: ["design boards", "api/service"],
          query: [["diagram", "https://design.example/d/board123?k=key&label=A B"]],
        },
      }),
    ).toBe(
      "/design%20boards/api%2Fservice?diagram=https%3A%2F%2Fdesign.example%2Fd%2Fboard123%3Fk%3Dkey%26label%3DA+B",
    );
  });

  it("ignores missing and malformed host state without interrupting the bridge", () => {
    expect(deepLinkUrl(undefined)).toBeUndefined();
    for (const state of [
      null,
      123,
      { url: 123 },
      { path: [], query: [["key"]] },
      { path: [123], query: [] },
      { path: ["\ud800"], query: [] },
    ])
      expect(deepLinkUrl({ "openai/deepLink": state })).toBeUndefined();
  });

  it("honors a supported cursor preference and defaults for older hosts", () => {
    expect(interactionCursor({ "openai/interactionCursor": "default" })).toBe("default");
    expect(interactionCursor({ "openai/interactionCursor": "pointer" })).toBe("pointer");
    expect(interactionCursor({ "openai/interactionCursor": "invalid" })).toBe("pointer");
    expect(interactionCursor({})).toBe("pointer");
  });
});
