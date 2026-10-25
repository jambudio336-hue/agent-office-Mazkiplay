# Agent Office cloud workspace/task API

The current Agent Office login system uses its own signed office sessions and local account IDs. Those IDs are opaque strings, not Supabase Auth UUIDs. To avoid silently breaking existing accounts, the cloud API uses separate `office_cloud_*` tables. They are not directly available to browser/mobile clients.

## Server configuration

Configure these variables only in the Node server's secret environment (never in Vite `VITE_*`, Android resources, or a public repo):

- `AGENT_OFFICE_SUPABASE_URL=https://fscqhvqzecqjkllwiuga.supabase.co` (optional; this is the default project URL)
- `AGENT_OFFICE_SUPABASE_SECRET_KEY=<Supabase secret key>` (preferred)
- Legacy alternative: `SUPABASE_SERVICE_ROLE_KEY=<legacy service_role key>`

The server must have a secret key to activate cloud sync. Without it, `GET /api/cloud/status` reports `configured: false` and cloud routes return HTTP 503. No key is stored in source control or automatically retrieved by this implementation. The server checks HTTPS and a Supabase hostname before making fixed-path REST requests, and never returns upstream database error details to clients.

## Existing-session security model

- Only a named account session can use cloud routes. Shared-password sessions remain local-only because they do not identify an individual account.
- The Node server validates the existing signed session first.
- Every data query is scoped by `owner_account_id` derived from that session; the client cannot choose the owner.
- Cross-origin writes are rejected.
- Cloud tables have RLS enabled, explicit deny policies for `anon` and `authenticated`, and no direct table grants for those roles. Only the server secret role has table privileges.
- Because the secret role bypasses RLS, backend owner filters are mandatory and must be tested. Never return the secret key to a client.
- Client task updates are restricted to queued tasks; clients cannot set a task to `running` or `succeeded`.

## Endpoints

- `GET /api/cloud/status`: whether server-side cloud sync is configured and whether the current session has a named account.
- `GET /api/cloud/workspaces`: list the current account's cloud workspaces.
- `POST /api/cloud/workspaces`: create a workspace (`name`, optional `description`).
- `GET /api/cloud/tasks`: list up to 100 tasks; optional `workspace_id` UUID filter.
- `POST /api/cloud/tasks`: create queued task metadata (`title`, optional `prompt`, `priority` 1–5, optional `workspace_id`).
- `PATCH /api/cloud/tasks/:id`: edit title/prompt or cancel a queued task.

These endpoints store cloud metadata. They do **not** execute agent work and do not yet synchronize the existing 3D office UI, Android companion, terminal processes, or worker manager. A trusted persistent worker and end-to-end tests remain required before claiming full integration.

## Deployment

The main application uses a persistent Node server, WebSocket, and PTY/terminal processes. Vercel can serve appropriate frontend/serverless portions, but this codebase must not be assumed to run as a complete persistent worker host just because a Vercel project exists. Keep the worker runtime on a verified Node-compatible host, and configure the secret directly in that host's secret manager.
