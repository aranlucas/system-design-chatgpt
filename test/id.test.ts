import { afterEach, expect, it, vi } from "vitest";
import { newId } from "@/shared/id.ts";

afterEach(() => vi.restoreAllMocks());

it("keeps capability IDs URL-safe and uses cryptographic entropy", () => {
  vi.spyOn(Math, "random").mockImplementation(() => {
    throw new Error("insecure entropy");
  });
  expect(newId()).toMatch(/^[A-Za-z0-9_-]{21}$/);
});
