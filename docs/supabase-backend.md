# Agent Office Supabase backend

Project: `mazkiplay-agent-office`  
Region: Singapore (`ap-southeast-1`)  
Project ref: `fscqhvqzecqjkllwiuga`

## Current state

The database schema is provisioned and verified. This is the data layer only: it does **not** mean the Agent Office frontend, Android companion, login flow, or persistent worker runtime is connected to it yet.

## Core tables

- `profiles`: metadata linked to Supabase Auth user IDs.
- `workspaces`: private workspaces owned by one user.
- `agent_tasks`: task queue metadata and status; it does not execute jobs.
- `task_events`: append-only event timeline for a task.
- `audit_logs`: audit records; client users can read their own records but cannot write or modify them.

Every table has RLS enabled. Anonymous `anon` access is revoked. Authenticated access is scoped to the signed-in user's ID. The service role is reserved for trusted server-side code only.

## Environment variables for a future client integration

Use only the project URL and Supabase **publishable** key in a browser/mobile client:

- `VITE_SUPABASE_URL=https://fscqhvqzecqjkllwiuga.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<set-in-local-environment-or-deployment-secrets>`

Do not commit real credentials. Never put a Supabase secret key, `service_role` key, database password, or provider API key in client code, Android resources, or a public repository. Server-only secrets must be configured in the chosen server host's secret manager.

## Safe rollout checklist

1. Configure Supabase Auth providers and redirect URLs before enabling sign-in in the app.
2. Add the publishable key only through local environment / deployment settings.
3. Implement the Supabase client and session lifecycle, then test owner-vs-other-user access.
4. Implement a trusted worker to claim tasks, update statuses, and write audit logs. Never let a client mark arbitrary tasks as completed by using a service-role credential.
5. Add automated RLS regression tests and run them against a disposable test project before production schema changes.
6. Keep the worker on a long-lived Node-compatible host for WebSocket/PTy processes; do not treat Vercel Functions as the persistent worker runtime.

## Cost posture

The project creation estimate was US$0/month. Supabase Free has quotas and can pause inactive projects; monitor usage. This does not cover any separately hosted worker or AI provider usage.
