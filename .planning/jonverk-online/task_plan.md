# Jonverk Online Chat

Goal: build, deploy, and verify an anonymous Durable Object room chat at `https://jonverk.online` from GitHub through Cloudflare Workers Builds.

## Phase 1: Workspace and source

**Status:** in_progress

- [ ] Create and commit the approved design document.
- [ ] Create the GitHub repository and connect the local main branch.
- [ ] Scaffold the React Router/Hono/shadcn template.
- [ ] Import the durable-chat server/client/shared pieces.

## Phase 2: Product integration

**Status:** pending

- [ ] Build the room and chat UI.
- [ ] Configure Durable Object bindings and migrations.
- [ ] Add validation, connection state, and tests.

## Phase 3: Cloudflare deployment

**Status:** pending

- [ ] Configure Worker name and production settings.
- [ ] Deploy and attach `jonverk.online`.
- [ ] Configure automatic GitHub-to-Cloudflare Builds.

## Phase 4: Verification

**Status:** pending

- [ ] Run typecheck, lint, tests, build, dry-run, and startup checks.
- [ ] Verify live HTTPS and two-client messaging.
- [ ] Verify an automatic build from `main`.
