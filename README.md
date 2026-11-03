<p align="center">
  <img src="public/icons/system-design-128.png" alt="" width="96" height="96" />
</p>

<h1 align="center">System Design for ChatGPT</h1>

<p align="center">
  Draw the system. Explain the trade-offs. Let your AI agent keep up.
</p>

<p align="center">
  <a href="https://github.com/aranlucas/system-design-chatgpt/actions/workflows/ci.yml"><img src="https://github.com/aranlucas/system-design-chatgpt/actions/workflows/ci.yml/badge.svg" alt="Checks" /></a>
</p>

<p align="center">
  <a href="#a-session">A session</a> ·
  <a href="#what-you-can-do">Features</a> ·
  <a href="docs/setup.md">Set up</a> ·
  <a href="docs/design.md">Design</a>
</p>

System Design for ChatGPT is a collaborative Excalidraw canvas with a ChatGPT
sidebar app and conversation panel. You and your agent work on the same diagram:
the agent sees components and connections, edits them through MCP, and can discuss
trade-offs against the system design rubric.

## A session

1. Sign in with GitHub and start a blank diagram or an interview, web-service,
   URL-shortener, or realtime chat template.
2. Share the board link with your interviewer. Anyone with the link can edit;
   collaborators do not need to sign in.
3. Connect your agent to the deployment's `/mcp` endpoint, approve GitHub OAuth,
   and say “join” with the share link.
4. Ask “add a cache in front of the database,” select the write path, then ask
   “what breaks at 10× traffic?” Agent edits appear on the shared canvas.
5. Save checkpoints during the discussion. **Versions** can restore an earlier
   scene; substantial agent edits also create automatic versions.

## What you can do

- Draw together with cursors, selections, editable architecture icons, and frames.
- Ask the agent to add, connect, rename, restyle, or move components. **Tidy** fixes
  spacing and overlaps; full graph layout is opt-in.
- Import Mermaid, take a screenshot, or point at components through an open canvas tab.
- Use the full editor and diagram chooser in ChatGPT's sidebar/conversation panel.
  **Use selection in chat** attaches the board and selection when the host supports it.
  MCP Apps clients can also show an inline diagram preview.
- Ask for a design review, next step, or capacity estimate through MCP prompts.
- Save private templates, resume boards from **Your diagrams**, and subscribe to
  board changes in hosts that support MCP Events.

## Get started

See [setup](docs/setup.md) for local development, Cloudflare resources, GitHub OAuth,
and MCP client connection commands. This repository contains configured resource
IDs: provision your own resources and replace those IDs for a separate deployment.

[Design](docs/design.md) explains trust boundaries, collaboration and recovery.
[ChatGPT integration](docs/chatgpt-plugin-api.md) covers the direct Extensions
protocol adapter and host validation. [ROADMAP.md](ROADMAP.md) records proposed
product priorities; [release gates](docs/openai-plugin-readiness.md) cover public
publishing preparation.

## Status and limits

A share link is an editing credential. GitHub sign-in protects creation, private
libraries, saved templates, and owner-only deletion; it does not make a shared board
invitation-only. Owners can permanently erase a board, but previously saved template
copies remain independent.

Screenshots, Mermaid conversion, and focus/point need an open canvas tab. The inline
preview renders images and embeds as placeholders. MCP Events are best-effort with no
replay; interactive OAuth cannot authorize an unattended client by itself.

The extension still needs validation in a deployed ChatGPT development plugin.
Local repository checks do not establish host availability, OAuth compatibility,
or nested-frame CSP behavior.

This repository starts from
[System Design Companion at `64b5b41`](https://github.com/aranlucas/system-design-companion/tree/64b5b415c59ac8d2f1fdf77e70fcba66e3716984).
It has its own history and deployment configuration.
