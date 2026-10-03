import { z } from "zod";

export type EmbeddedContextMessage = {
  type: "system-design.context";
  selectedElementIds: string[];
};

type EmbeddedLibraryMessage = { type: "system-design.library" };

type EmbeddedReadyMessage = { type: "system-design.ready" };

export type EmbeddedCanvasMessage =
  | EmbeddedContextMessage
  | EmbeddedLibraryMessage
  | EmbeddedReadyMessage;

export type EmbeddedHostMessage = { type: "system-design.theme"; theme: "light" | "dark" };

export function embeddedHostOrigin(search: string): string | undefined {
  const value = new URLSearchParams(search).get("host_origin");

  if (!value) return undefined;

  try {
    const url = new URL(value);

    if ((url.protocol === "https:" || url.protocol === "http:") && url.origin === value)
      return value;
  } catch {
    // Invalid embedding configuration behaves like a regular browser canvas.
  }

  return undefined;
}

/** The host may only embed the editor on this deployment's exact origin. */
export function embeddedCanvasUrl(diagram: string, origin: string, hostOrigin: string): string {
  const url = new URL(diagram, origin);

  if (
    url.origin !== origin ||
    url.username ||
    url.password ||
    !/^\/d\/[A-Za-z0-9_-]{8,64}$/.test(url.pathname) ||
    !/^[A-Za-z0-9_-]+$/.test(url.searchParams.get("k") ?? "") ||
    !embeddedHostOrigin(new URLSearchParams({ host_origin: hostOrigin }).toString())
  )
    throw new Error("Use a diagram share link from this deployment.");
  url.hash = "";
  url.searchParams.set("host_origin", hostOrigin);

  return url.href;
}

const canvasMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("system-design.library") }),
  z.object({ type: z.literal("system-design.ready") }),
  z.object({
    type: z.literal("system-design.context"),
    selectedElementIds: z.array(z.string().max(64)).max(500),
  }),
]);

const hostMessageSchema = z.object({
  type: z.literal("system-design.theme"),
  theme: z.enum(["light", "dark"]),
});

export function isEmbeddedCanvasMessage(value: unknown): value is EmbeddedCanvasMessage {
  return canvasMessageSchema.safeParse(value).success;
}

export function isEmbeddedHostMessage(value: unknown): value is EmbeddedHostMessage {
  return hostMessageSchema.safeParse(value).success;
}
