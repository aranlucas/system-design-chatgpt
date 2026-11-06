import { afterEach, describe, expect, it, vi } from "vitest";
import { exchangeGithubCode, githubAuthorizationUrl, githubSubject } from "@/worker/github-auth.ts";
import { makeEnv } from "@test/helpers/fakes.ts";

afterEach(() => vi.unstubAllGlobals());

describe("shared GitHub authentication", () => {
  it("uses the RFC 7636 S256 example for both sign-in flows", async () => {
    const { env } = makeEnv();
    env.GITHUB_CLIENT_ID = "client";
    const url = await githubAuthorizationUrl(env, {
      origin: "https://design.example",
      state: "consent-state",
      verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
    });
    expect(url.searchParams.get("code_challenge")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
    expect(url.searchParams.get("redirect_uri")).toBe("https://design.example/github/callback");
    expect(url.searchParams.get("state")).toBe("consent-state");
  });

  it("keeps ownership subjects stable and rejects malformed profile identities", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: 123 }))
      .mockResolvedValueOnce(Response.json({ id: "123" }));
    vi.stubGlobal("fetch", fetch);
    expect(await githubSubject("token")).toBe("github%3A123");
    expect(await githubSubject("token")).toBeNull();
  });

  it("bounds upstream token and profile bodies even without Content-Length", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(
            new Response(JSON.stringify({ access_token: "x".repeat(17 * 1024), id: 123 })),
          ),
        ),
    );
    const { env } = makeEnv();
    await expect(
      exchangeGithubCode(env, {
        origin: "https://design.example",
        code: "code",
        verifier: "verifier",
      }),
    ).rejects.toThrow("Request body is too large.");
    await expect(githubSubject("token")).rejects.toThrow("Request body is too large.");
  });
});
