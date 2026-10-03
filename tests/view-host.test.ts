import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@modelcontextprotocol/ext-apps";
import { createViewHost, type ViewHost } from "../src/view/host.ts";

const mcpApp = new App({ name: "view-host-test", version: "1.0.0" });

const mcpSpies = {
  connect: vi.spyOn(mcpApp, "connect"),
  close: vi.spyOn(mcpApp, "close"),
  getHostContext: vi.spyOn(mcpApp, "getHostContext"),
  callServerTool: vi.spyOn(mcpApp, "callServerTool"),
  openLink: vi.spyOn(mcpApp, "openLink"),
  requestDisplayMode: vi.spyOn(mcpApp, "requestDisplayMode"),
};

const LINK = "https://design.example/d/board123?k=share-key";

let host: ViewHost | undefined;

beforeEach(() => {
  vi.resetAllMocks();
  mcpSpies.connect.mockResolvedValue(undefined);
  mcpSpies.close.mockResolvedValue(undefined);
  mcpSpies.callServerTool.mockResolvedValue({ content: [] });
  mcpSpies.openLink.mockResolvedValue({});
  mcpSpies.requestDisplayMode.mockResolvedValue({ mode: "fullscreen" });
  mcpSpies.getHostContext.mockReturnValue({ theme: "dark", availableDisplayModes: ["inline"] });
});

afterEach(() => {
  host?.dispose();
  host = undefined;
});

describe("MCP Apps with OpenAI Extensions", () => {
  it("receives initial tool input during connection and subsequent delayed input", async () => {
    const onDiagram = vi.fn();
    const onContext = vi.fn();
    mcpSpies.connect.mockImplementation(async () => {
      mcpApp.ontoolinput?.({ arguments: { diagram: LINK } });
    });
    host = createViewHost(mcpApp);
    await host.start({ onDiagram, onContext });
    expect(onDiagram).toHaveBeenCalledWith(LINK);
    expect(onContext).toHaveBeenCalledWith({ theme: "dark", availableDisplayModes: ["inline"] });
    mcpApp.ontoolinput?.({});
    expect(onDiagram).toHaveBeenCalledTimes(1);
    mcpApp.ontoolinput?.({ arguments: { diagram: "next-link" } });
    expect(onDiagram).toHaveBeenLastCalledWith("next-link");
  });

  it("receives a deep link from documented Extensions host context", async () => {
    mcpSpies.getHostContext.mockReturnValue({
      "openai/deepLink": { url: `/?diagram=${encodeURIComponent(LINK)}` },
    });
    const onDiagram = vi.fn();
    host = createViewHost(mcpApp);
    await host.start({ onDiagram, onContext: vi.fn() });
    expect(onDiagram).toHaveBeenCalledWith(LINK);
    mcpApp.onhostcontextchanged?.({ theme: "light" });
    expect(onDiagram).toHaveBeenCalledTimes(1);
  });

  it("ignores malformed deep links without interrupting host updates", async () => {
    mcpSpies.getHostContext.mockReturnValue({ "openai/deepLink": { url: "http://[" } });
    const onDiagram = vi.fn();
    const onContext = vi.fn();
    host = createViewHost(mcpApp);
    await host.start({ onDiagram, onContext });
    expect(onDiagram).not.toHaveBeenCalled();
    mcpApp.onhostcontextchanged?.({ theme: "dark" });
    expect(onContext).toHaveBeenLastCalledWith({ theme: "dark" });
  });

  it("accepts the legacy deep-link payload on later host updates", async () => {
    const onDiagram = vi.fn();
    host = createViewHost(mcpApp);
    await host.start({ onDiagram, onContext: vi.fn() });
    mcpSpies.getHostContext.mockReturnValue({
      "openai/deepLink": { path: [], query: [["diagram", LINK]] },
    });
    mcpApp.onhostcontextchanged?.({ theme: "light" });
    expect(onDiagram).toHaveBeenLastCalledWith(LINK);
  });

  it("keeps shared tool, display, and navigation APIs working without OpenAI host capabilities", async () => {
    host = createViewHost(mcpApp);
    await host.start({ onDiagram: vi.fn(), onContext: vi.fn() });
    await host.callTool("render_scene", { diagram: LINK });
    expect(mcpSpies.callServerTool).toHaveBeenCalledWith({
      name: "render_scene",
      arguments: { diagram: LINK },
    });
    await host.openLink(LINK);
    expect(mcpSpies.openLink).toHaveBeenCalledWith({ url: LINK });
    await host.requestDisplayMode("fullscreen");
    expect(mcpSpies.requestDisplayMode).toHaveBeenCalledWith({ mode: "fullscreen" });
    host.dispose();
    expect(mcpSpies.close).toHaveBeenCalled();
  });

  it("preserves tool and connection failures for the view to display", async () => {
    host = createViewHost(mcpApp);
    mcpSpies.connect.mockRejectedValue(new Error("Disconnected"));
    await expect(host.start({ onDiagram: vi.fn(), onContext: vi.fn() })).rejects.toThrow(
      "Disconnected",
    );
    mcpSpies.callServerTool.mockRejectedValue(new Error("Revoked link"));
    await expect(host.callTool("render_scene", { diagram: LINK })).rejects.toThrow("Revoked link");
  });
});
