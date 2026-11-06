import { expect } from "e2e";
import { test } from "@e2e-dev/web";

// A controlled socket transport drops an outgoing frame and repeats the server's
// empty init. The real editor must resend the unchanged local element.
test("reconnect resends a local element missing from the server receipt", async ({
  app,
  browser,
}) => {
  await browser.addInitScript(`
    window.__updates = [];
    class Socket extends EventTarget {
      static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3;
      readyState = 0; bufferedAmount = 0; protocol = ''; extensions = '';
      constructor(url) {
        super(); this.url = url; window.__socket = this;
        setTimeout(() => {
          this.readyState = 1;
          this.dispatchEvent(new Event('open'));
          this.init();
        }, 0);
      }
      init() {
        this.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify({ type: 'init', elements: [], name: 'Reconnect board' })
        }));
      }
      send(data) {
        const message = JSON.parse(data);
        if (message.type === 'update') window.__updates.push(message);
      }
      close() { this.readyState = 3; }
    }
    window.WebSocket = Socket;
  `);
  await app.open("/d/reconnect123?k=fixture");
  await expect
    .poll(() =>
      browser.evaluate(
        "Boolean(window.excalidrawAPI && document.title.includes('Reconnect board'))",
      ),
    )
    .toBe(true);
  await browser.evaluate(`() => {
    window.excalidrawAPI.updateScene({ elements: [{
      id: 'lost-element', type: 'rectangle', x: 100, y: 100,
      width: 160, height: 70, version: 1, versionNonce: 1,
      isDeleted: false, index: 'a0', seed: 1, angle: 0,
      strokeColor: '#000000', backgroundColor: 'transparent', fillStyle: 'solid',
      strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100,
      groupIds: [], frameId: null, boundElements: null, link: null,
      locked: false, updated: 1, roundness: null
    }] });
  }`);
  await expect.poll(() => browser.evaluate("window.__updates.length")).toBe(1);
  await browser.evaluate("window.__socket.init()");
  await expect.poll(() => browser.evaluate("window.__updates.length")).toBe(2);
  expect(await browser.evaluate("window.__updates[1].elements.map(element => element.id)")).toEqual(
    ["lost-element"],
  );
});
