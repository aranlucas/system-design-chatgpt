import { expect } from "e2e";
import { test } from "@e2e-dev/web";

// Browser contract fixtures deliberately avoid GitHub or production resources.
// The unsigned journey below still reaches the real local Worker.
test("an unsigned visitor cannot create a board or load a private library", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/");
  await expect(screen.getByRole("link", "Sign in with GitHub")).toBeVisible();

  const statuses = await browser.evaluate(async () => {
    const library = await fetch("/api/diagrams");

    const create = await fetch("/api/diagrams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauthorized", template: "" }),
    });

    return [library.status, create.status];
  });

  expect(statuses).toEqual([401, 401]);
});

test("library delete failures preserve the board, retry removes it, and logout clears private UI", async ({
  app,
  browser,
  screen,
}) => {
  let signedIn = true;
  let deleted = false;
  let deleteAttempts = 0;
  await browser.route("**/api/auth/session", (route) => route.fulfill({ json: { signedIn } }));
  await browser.route("**/api/templates", (route) => route.fulfill({ json: [] }));
  await browser.route("**/api/diagrams?*", (route) =>
    route.fulfill({
      json: {
        items: deleted
          ? []
          : [{ id: "board12345", name: "Recovery board", key: "fixture-key", createdAt: 1 }],
        nextCursor: null,
      },
    }),
  );
  await browser.route("**/api/diagrams/board12345", async (route) => {
    expect(route.request.method).toBe("DELETE");
    deleteAttempts++;

    if (deleteAttempts === 1) {
      await route.fulfill({ status: 503, json: { error: "Temporarily unavailable" } });
    } else {
      deleted = true;
      await route.fulfill({ status: 204 });
    }
  });
  await browser.route("**/api/auth/logout", async (route) => {
    expect(route.request.method).toBe("POST");
    signedIn = false;
    await route.fulfill({ status: 204 });
  });
  await app.open("/");
  await expect(screen.getByRole("link", "Recovery board")).toBeVisible();
  const dismiss = await browser.onDialog("dismiss");
  await screen.getByRole("button", "Delete Recovery board").tap();
  await dismiss();
  expect(deleteAttempts).toBe(0);
  const accept = await browser.onDialog("accept");
  await screen.getByRole("button", "Delete Recovery board").tap();
  await expect(screen.getByRole("alert")).toContainText("Could not delete diagram");
  await expect(screen.getByRole("link", "Recovery board")).toBeVisible();
  await screen.getByRole("button", "Delete Recovery board").tap();
  await expect(
    screen.getByText("No diagrams yet. Create one here or through your agent."),
  ).toBeVisible();
  expect(deleteAttempts).toBe(2);
  await accept();
  await screen.getByRole("button", "Sign out").tap();
  await expect(screen.getByRole("link", "Sign in with GitHub")).toBeVisible();
  await expect(screen.getByRole("button", "Create")).not.toBeVisible();
  await browser.reload();
  await expect(screen.getByRole("link", "Sign in with GitHub")).toBeVisible();
});
