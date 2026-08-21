# Jonverk Online Chat Design

## Goal

Deploy a public, anonymous, real-time room chat at `https://jonverk.online` using the Cloudflare React Router + Hono + shadcn/ui full-stack template as the application shell and the v9.0.0 durable-chat template as the chat engine.

## Architecture

- Frontend: React Router SPA, Vite, Tailwind CSS, and shadcn/ui components from `cloudflare/templates/react-router-hono-fullstack-template`.
- Worker: Hono routes and the Cloudflare Vite plugin in the same Worker deployment.
- Chat state: one Durable Object per room, selected from a URL-safe room identifier.
- Realtime transport: WebSocket connections managed with the durable-chat template’s PartyServer integration.
- Persistence: Durable Object SQL storage for room message history.
- Identity: anonymous display name chosen in the browser; no account system or authentication in v1.
- Routing: `/` creates or opens a room; `/room/:roomId` opens a shareable room. WebSocket traffic stays on the same origin.

## Deployment

- Repository: `skneland/jonverk-online`, branch `main`.
- Worker name: `jonverk-online`.
- Cloudflare account: `03a9ef9088d1cd4a5cb7bb4281b5a4ee` (Rins Account).
- Cloudflare Workers Builds watches the GitHub repository and deploys on pushes to `main`.
- The apex custom domain `jonverk.online` is detached from `polished-leaf-25ce` and attached to `jonverk-online`.
- Existing email-routing MX/TXT records remain unchanged. No `www` hostname is introduced in v1.

## UI

- Preserve the template’s shadcn visual language and accessibility primitives.
- Provide a responsive two-state experience: a room landing/join state and a live chat state.
- Include copy-room-link, connection status, message history, message composer, and a clear empty state.
- Keep the UI focused on chat; no unrelated product features or authentication screens.

## Error handling

- Show a non-blocking connection status for connecting, connected, reconnecting, and failed states.
- Disable send while disconnected and retain unsent composer text.
- Validate and bound display names and message lengths at the client and server boundaries.
- Return useful HTTP errors for malformed room identifiers and WebSocket upgrade failures without exposing secrets.

## Verification

- Install dependencies and run the repository’s typecheck/lint/build commands.
- Run Wrangler’s dry-run/startup checks where supported.
- Start the Worker locally and verify room creation, WebSocket connection, message persistence, and reconnect behavior with automated tests or a focused integration harness.
- After deployment, verify `https://jonverk.online` serves the app and exercise a two-client room exchange against the live Worker.
- Verify a push to `main` produces a successful Cloudflare Workers Build.
