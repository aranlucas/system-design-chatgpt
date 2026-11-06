import { z } from "zod";
import { readBounded } from "./request-limits.ts";
import { CALLBACK_PATH } from "./oauth-paths.ts";

type GithubAuthorization = { origin: string; state: string; verifier: string };

type GithubExchange = { origin: string; code: string; verifier: string };

const tokenSchema = z.object({ access_token: z.string().optional(), error: z.string().optional() });

const identitySchema = z.object({ id: z.number().refine(Number.isSafeInteger).positive() });

async function responseJson(response: Response): Promise<unknown> {
  return JSON.parse(new TextDecoder().decode(await readBounded(response.body, 16 * 1024)));
}

export async function githubAuthorizationUrl(env: Env, auth: GithubAuthorization): Promise<URL> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(auth.verifier));
  const challenge = btoa(String.fromCodePoint(...new Uint8Array(digest)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${auth.origin}${CALLBACK_PATH}`,
    // Public identity needs no email or private-profile scope.
    scope: "",
    state: auth.state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  return url;
}

export async function exchangeGithubCode(env: Env, exchange: GithubExchange) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: exchange.code,
      redirect_uri: `${exchange.origin}${CALLBACK_PATH}`,
      code_verifier: exchange.verifier,
    }),
  });
  const token = tokenSchema.parse(await responseJson(response));

  return { ...token, ok: response.ok, status: response.status };
}

export async function githubSubject(accessToken: string): Promise<string | null> {
  const response = await fetch("https://api.github.com/user", {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "system-design-chatgpt",
    },
  });

  if (!response.ok) {
    await response.body?.cancel();

    return null;
  }

  const identity = identitySchema.safeParse(await responseJson(response));

  // Browser sessions and MCP grants must use the same ownership namespace.
  return identity.success ? encodeURIComponent(`github:${identity.data.id}`) : null;
}
