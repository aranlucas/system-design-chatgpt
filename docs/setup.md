# Setup

## Run locally

Use the Node version in `.node-version` and pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` builds both MCP views, then runs Vite through Portless. The usual URL is
`https://system-design-chatgpt.localhost`; linked worktrees receive a branch prefix.
Use the URL Portless prints. Its first run may need permission to bind port 443 and
trust its local certificate. Node clients outside Portless may need
`NODE_EXTRA_CA_CERTS=~/.portless/ca.pem`.

Configure GitHub sign-in below, then open the local URL and create a diagram.
Register the local MCP endpoint with your client:

```sh
claude mcp add --transport http system-design https://system-design-chatgpt.localhost/mcp
codex mcp add system-design --url https://system-design-chatgpt.localhost/mcp
```

Substitute the worktree origin when applicable. Approve the OAuth flow, then tell the
agent “join” with a board's share link. Use your deployment origin for a hosted server.

## Cloudflare resources and deployment

`cloudflare.config.ts` is used by the current Vite/`cf` build. `wrangler.jsonc` retains
compatibility routing and bindings for Wrangler. Both contain configured D1/KV IDs;
for a new deployment, provision your own resources and replace the corresponding IDs
in both files. The configured bucket names also need to exist in your account.

Provision matching production and preview resources:

```sh
pnpm exec cf d1 create --name system-design-chatgpt
pnpm exec cf r2 buckets create --name system-design-chatgpt
pnpm exec cf kv namespaces create --title system-design-chatgpt-oauth
pnpm exec cf d1 create --name system-design-chatgpt-preview
pnpm exec cf r2 buckets create --name system-design-chatgpt-preview
pnpm exec cf kv namespaces create --title system-design-chatgpt-preview-oauth
```

These commands use the repository's installed `cf` dependency. Copy each returned
D1/KV ID into its production or preview binding before deploying. Configure secrets
separately for each environment and register its actual OAuth callback origin.

```sh
pnpm deploy            # build and cf deploy --prebuilt
pnpm deploy:preview    # build preview and cf previews deploy --prebuilt
```

Preview builds select bindings through `ctx.isPreview` in `cloudflare.config.ts`.
Preview Durable Object storage is isolated; D1, R2 and OAuth KV are shared across
previews using the configured preview resources. Never point these bindings at
production when testing. Git-connected build commands and branch rules must be
configured in Cloudflare; this repository's GitHub workflow runs checks, not deployment.

## GitHub OAuth

Create a GitHub OAuth app per deployment (GitHub **Settings → Developer settings →
OAuth Apps**): homepage is the deployment origin; callback is
`<origin>/github/callback`. The homepage and agents use the same callback and GitHub
identity. GitHub sign-in requests public profile identity without email access;
GitHub's token is not handed to the MCP client.

Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as secrets in the deployment's
Worker settings in Cloudflare. Configure the preview deployment separately.

For local sign-in, register the exact Portless/worktree origin and put the credentials
in ignored `.dev.vars`:

```dotenv
GITHUB_CLIENT_ID=<local-app-client-id>
GITHUB_CLIENT_SECRET=<local-app-client-secret>
```

Without both secrets, `/mcp` still challenges for a token but `/authorize` reports
unconfigured sign-in. Production and preview use separate `OAUTH_KV` namespaces for
auth state. OAuth needs an interactive browser; unattended clients cannot authorize
themselves. See [access boundaries](design.md#access-and-privacy) for scopes and sharing.

## Local checks

```sh
pnpm check     # TypeScript, Oxlint, Oxfmt
pnpm test      # Vitest
pnpm build     # both self-contained views and the application/Worker
pnpm format    # apply Oxfmt
```

CI performs a frozen install with strict peer dependencies, then typechecks, linting,
formatting, tests and a build. For bundle diagnosis, build the views first, then run
`pnpm exec vite build --sourcemap`; run a normal build afterward to remove source maps.

## MCP events

Event discovery/subscriptions require MCP protocol `2026-07-28`. Configure
`MCP_EVENT_CALLBACK_HOSTS` with exact hostnames operated by trusted MCP receivers.
Obtain them from the connector callback configuration or the redacted `url` in a
`host_not_allowed` error. Client names are not callback hostnames; wildcards and
user-controlled domains must not be allowed.

Set the comma-separated hostnames as the `MCP_EVENT_CALLBACK_HOSTS` Worker secret.
For local development,
use `MCP_EVENT_CALLBACK_HOSTS=<trusted-callback-host>` in `.dev.vars`; configure preview
separately. An empty list rejects subscriptions while ordinary tools remain available.
Keep `global_fetch_strictly_public` enabled. See [event security and reliability](design.md#mcp-events)
for the DNS trust boundary and delivery limits.

Subscriptions default to 12 hours, bounded to 5 minutes–7 days. Refresh extends the
expiry and can rotate the signing secret, with a five-minute overlap. Webhooks carry
`webhook-id`, `webhook-timestamp`, `webhook-signature` and `X-MCP-Subscription-Id`.

Test in the intended host with sample data:

1. Connect authenticated `/mcp` and rescan. Confirm `diagram.changed`,
   `diagram.renamed`, and `diagram.checkpointed` are discovered.
2. Ask “watch this diagram and when I change it, tell me what you would add.”
   Confirm callback verification succeeds.
3. Edit, rename and save a named checkpoint; confirm delivery and a chat response.
4. Confirm agent edits are withheld unless `include_agent: true` was requested.
5. Unsubscribe and verify delivery stops. Revoke the connector and verify subscriptions
   stop after revocation becomes visible.

Repository transport tests use fake infrastructure and receiver APIs. They do not
establish that a deployed host can complete OAuth or accept callbacks.

## OpenAI domain verification

Set `OPENAI_APPS_CHALLENGE` to the portal's exact token.
`/.well-known/openai-apps-challenge` serves it as plain text and returns 404 when
unconfigured. Preserve Worker-first routing so the SPA cannot answer this request.
For host-specific checks, see [ChatGPT integration](chatgpt-plugin-api.md).
