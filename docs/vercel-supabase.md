# Mazkiplay Agent Office — Vercel + Supabase

## Intended architecture
- Vercel hosts the web client and compatible serverless endpoints.
- Supabase provides Auth and Postgres for profiles, office settings, workers (maximum 20), tasks, and provider/model preferences.
- Android APK can later package the client and use native Android capabilities where required.

## Important compatibility note
The current Agent Office server is a long-running Node.js service. It uses terminal/PTY processes, agent CLI executables, Git, and WebSockets. A normal Vercel serverless deployment cannot run that whole server unchanged or keep coding-agent processes alive indefinitely. Deploying only the Vite client to Vercel does not make existing worker terminals functional.

Migration is required: retain the 3D client, move supported persistent data to Supabase, and replace server-dependent features with compatible APIs or an explicitly managed worker runtime. Do not claim the full office is online until these paths are implemented and tested.

## Supabase database
1. Create a Supabase project.
2. Open SQL Editor.
3. Run supabase/migrations/202610230001_office_foundation.sql.
4. Enable intended sign-in methods in Authentication.
5. Review tables and RLS policies before production.

The migration creates owner-scoped tables for profiles, office settings, workers, tasks, and provider/model preferences. Row Level Security restricts records to the signed-in owner. A database trigger blocks inserting a 21st worker.

## Vercel
1. Import this GitHub repository into Vercel.
2. Do not consider deployment complete until the Vite client has a compatible API base and server dependencies have been migrated.
3. Add environment variables in Vercel Project Settings. Use .env.example as a names-only reference.
4. Only the Supabase project URL and anon/publishable key may be exposed to the browser. Never expose the service-role key or AI provider keys in VITE_* variables or the APK.
5. Test sign-in, RLS, worker cap, task CRUD, and API errors in Preview before Production.

## API keys
This migration intentionally stores provider names and model IDs, not raw API keys. Provider secrets must stay in server-only environment variables or use a deliberate encrypted-secret design. Never commit keys, embed them in source, put them in URLs, or package them in an APK.

## Current status
This is the database foundation only. It does not yet connect the existing UI to Supabase, implement provider API calls, convert terminal-based coding agents to Android, or publish a working APK.
