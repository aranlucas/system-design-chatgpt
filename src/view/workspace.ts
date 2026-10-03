import { z } from "zod";
import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import { deepLinkUrl, interactionCursor } from "../shared/openai-extensions.ts";
import { embeddedCanvasUrl, isEmbeddedCanvasMessage } from "../shared/embedded-canvas.ts";

type DiagramOption = { name: string; diagram: string };

const libraryPageSchema = z.object({
  diagrams: z.array(z.object({ name: z.string(), diagram: z.string() })),
  nextCursor: z.string().nullable(),
  activeDiagram: z.string().optional(),
  activeName: z.string().optional(),
});

const joinedSceneSchema = z.object({ diagram: z.string() });

type WorkspaceResult = { structuredContent?: unknown; isError?: boolean };

const app = new App(
  { name: "system-design-workspace", version: "1.0.0" },
  { availableDisplayModes: ["fullscreen"] },
  { autoResize: false },
);

const origin = document.querySelector<HTMLMetaElement>('meta[name="canvas-origin"]')!.content;

type ElementConstructor<T extends HTMLElement> = { new (): T };

function requiredElement<T extends HTMLElement>(id: string, ctor: ElementConstructor<T>): T {
  const node = document.getElementById(id);

  if (!(node instanceof ctor)) throw new Error(`Missing ${id} element`);

  return node;
}

const select = requiredElement("diagrams", HTMLSelectElement);

const frame = requiredElement("canvas", HTMLIFrameElement);

const empty = document.getElementById("empty")!;

const status = document.getElementById("status")!;

const refresh = requiredElement("refresh", HTMLButtonElement);

const more = requiredElement("more", HTMLButtonElement);

const library = requiredElement("library", HTMLButtonElement);

const input = requiredElement("link", HTMLInputElement);

let activeDiagram: string | undefined;

let activeName = "Shared diagram";

let cursor: string | null = null;

let connected = false;

let editorReady = false;

let theme: "light" | "dark" = "light";

let lastDeepLink: string | undefined;

let navigationVersion = 0;

function errorMessage(cause: unknown) {
  status.textContent = cause instanceof Error ? cause.message : "Could not complete this action.";
}

async function publishContext(selectedElementIds: string[] = []) {
  const params = {
    content: [
      {
        type: "text" as const,
        text: activeDiagram
          ? `Active system design diagram: ${select.selectedOptions[0]?.textContent ?? "Shared diagram"}.`
          : "The system design workspace is showing the diagram library.",
      },
    ],
    structuredContent: { diagram: activeDiagram ?? null, selectedElementIds },
  };

  if (app.getHostCapabilities()?.updateModelContext) await app.updateModelContext(params);
  else return false;

  return true;
}

function openDiagram(diagram: string, name?: string) {
  const url = embeddedCanvasUrl(diagram, origin, location.origin);
  navigationVersion++;
  activeName =
    name ??
    Array.from(select.options).find((option) => option.value === diagram)?.text ??
    "Shared diagram";
  addDiagram({ diagram, name: activeName });
  activeDiagram = diagram;
  editorReady = false;
  frame.src = url;
  frame.hidden = false;
  empty.hidden = true;
  library.hidden = false;
  select.value = diagram;
  status.textContent = "Canvas open. Edits sync with your browser and ChatGPT.";

  if (connected) void publishContext().catch(errorMessage);
}

function addDiagram(option: DiagramOption) {
  if (Array.from(select.options).some((existing) => existing.value === option.diagram)) return;
  const node = document.createElement("option");
  node.value = option.diagram;
  node.textContent = option.name;
  select.append(node);
}

function receiveLibrary(result: WorkspaceResult, append = false) {
  if (result.isError) throw new Error("Could not load your diagrams.");
  const parsed = libraryPageSchema.safeParse(result.structuredContent);

  if (!parsed.success) throw new Error("The server returned an invalid diagram library.");
  const page = parsed.data;

  if (!append) select.replaceChildren(new Option("Choose a diagram", ""));

  for (const diagram of page.diagrams) addDiagram(diagram);
  cursor = page.nextCursor;
  more.hidden = !cursor;

  if (page.activeDiagram) openDiagram(page.activeDiagram, page.activeName);
  else if (activeDiagram) {
    addDiagram({ diagram: activeDiagram, name: activeName });
    select.value = activeDiagram;
  } else
    status.textContent = page.diagrams.length
      ? "Choose a diagram to start."
      : "Your library is empty.";
}

async function loadLibrary(append = false) {
  refresh.disabled = true;
  more.disabled = true;

  try {
    const result = await app.callServerTool({
      name: "list_diagrams",
      arguments: append && cursor ? { cursor } : {},
    });

    receiveLibrary(result, append);
  } catch (error) {
    errorMessage(error);
  } finally {
    refresh.disabled = false;
    more.disabled = false;
  }
}

async function joinDiagram(diagram: string) {
  // Check the origin before any tool call or iframe navigation.
  embeddedCanvasUrl(diagram, origin, location.origin);
  const version = ++navigationVersion;
  const result = await app.callServerTool({ name: "join_session", arguments: { diagram } });

  if (version !== navigationVersion) return;

  if (result.isError)
    throw new Error(
      result.content.find((item) => item.type === "text")?.text ?? "Could not join the diagram.",
    );
  const parsed = joinedSceneSchema.safeParse(result.structuredContent);

  if (!parsed.success) throw new Error("The server returned an invalid diagram.");
  const data = parsed.data;
  addDiagram({ name: data.diagram, diagram });
  openDiagram(diagram);
}

function applyDeepLink() {
  const link = deepLinkUrl(app.getHostContext());

  if (!link || link === lastDeepLink) return;
  lastDeepLink = link;

  try {
    const diagram = new URL(link, origin).searchParams.get("diagram");

    if (diagram) void joinDiagram(diagram).catch(errorMessage);
  } catch (error) {
    errorMessage(error);
  }
}

function sendTheme() {
  if (!editorReady) return;
  frame.contentWindow?.postMessage({ type: "system-design.theme", theme }, origin);
}

function applyContext(context: McpUiHostContext) {
  document.documentElement.style.setProperty("--cursor-interaction", interactionCursor(context));

  if (context.theme) {
    theme = context.theme;
    applyDocumentTheme(theme);
    sendTheme();
  }

  if (context.styles?.variables) applyHostStyleVariables(context.styles.variables);

  if (connected) applyDeepLink();
}

app.ontoolresult = (result) => {
  try {
    receiveLibrary(result);
  } catch (error) {
    errorMessage(error);
  }
};

app.onhostcontextchanged = applyContext;

select.addEventListener("change", () => {
  if (select.value) {
    try {
      openDiagram(select.value);
    } catch (error) {
      errorMessage(error);
    }
  }
});

refresh.addEventListener("click", () => void loadLibrary());

more.addEventListener("click", () => void loadLibrary(true));

function showLibrary() {
  navigationVersion++;
  activeDiagram = undefined;
  editorReady = false;
  frame.removeAttribute("src");
  frame.hidden = true;
  empty.hidden = false;
  library.hidden = true;
  select.value = "";
  status.textContent = "Choose a diagram or open a shared link.";
  void publishContext().catch(errorMessage);
}

library.addEventListener("click", showLibrary);

document.getElementById("join")!.addEventListener("submit", (event) => {
  event.preventDefault();
  void joinDiagram(input.value.trim()).catch(errorMessage);
});

window.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (
    !activeDiagram ||
    event.source !== frame.contentWindow ||
    event.origin !== origin ||
    !isEmbeddedCanvasMessage(event.data)
  )
    return;

  if (event.data.type === "system-design.library") showLibrary();
  else if (event.data.type === "system-design.ready") {
    editorReady = true;
    sendTheme();
  } else
    void publishContext(event.data.selectedElementIds)
      .then((attached) => {
        status.textContent = attached
          ? "Selection attached to chat."
          : "Open a conversation panel to attach a selection.";

        return undefined;
      })
      .catch(errorMessage);
});

window.addEventListener("pagehide", () => void app.close());

async function start() {
  await app.connect();
  connected = true;
  const context = app.getHostContext();

  if (context) applyContext(context);

  if (
    context?.displayMode !== "fullscreen" &&
    context?.availableDisplayModes?.includes("fullscreen")
  )
    await app.requestDisplayMode({ mode: "fullscreen" });

  if (activeDiagram) await publishContext();
  applyDeepLink();
}

void start().catch(errorMessage);
