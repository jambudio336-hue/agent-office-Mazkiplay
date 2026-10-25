-- Agent Office core schema
-- Owner-scoped data model. No anonymous access; authenticated access is restricted by RLS.
-- Admin-only audit writes are expected to come from trusted server code using service_role.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  prompt text not null default '' check (char_length(prompt) <= 20000),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','cancelled')),
  priority smallint not null default 3 check (priority between 1 and 5),
  assigned_agent text,
  result_summary text not null default '' check (char_length(result_summary) <= 10000),
  error_summary text not null default '' check (char_length(error_summary) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint agent_tasks_workspace_owner_consistent
    check (workspace_id is null or owner_id is not null)
);

create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(trim(event_type)) between 1 and 80),
  message text not null default '' check (char_length(message) <= 10000),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid references auth.users(id) on delete set null,
  actor_id uuid,
  action text not null check (char_length(trim(action)) between 1 and 120),
  resource_type text not null default 'system' check (char_length(resource_type) <= 80),
  resource_id text,
  outcome text not null default 'success' check (outcome in ('success','denied','error')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index workspaces_owner_created_idx on public.workspaces (owner_id, created_at desc);
create index agent_tasks_owner_status_created_idx on public.agent_tasks (owner_id, status, created_at desc);
create index agent_tasks_workspace_idx on public.agent_tasks (workspace_id) where workspace_id is not null;
create index task_events_task_created_idx on public.task_events (task_id, created_at desc);
create index task_events_owner_created_idx on public.task_events (owner_id, created_at desc);
create index audit_logs_owner_created_idx on public.audit_logs (owner_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.task_events enable row level security;
alter table public.audit_logs enable row level security;

-- Remove implicit Data API access and explicitly grant only what each role needs.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.agent_tasks to authenticated;
grant select, insert on public.task_events to authenticated;
grant select on public.audit_logs to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Prevent future tables from silently inheriting broad client access.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy workspaces_select_own on public.workspaces
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy workspaces_insert_own on public.workspaces
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy workspaces_update_own on public.workspaces
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy workspaces_delete_own on public.workspaces
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy agent_tasks_select_own on public.agent_tasks
  for select to authenticated using (
    (select auth.uid()) = owner_id
    and (workspace_id is null or exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_id = (select auth.uid())
    ))
  );
create policy agent_tasks_insert_own on public.agent_tasks
  for insert to authenticated with check (
    (select auth.uid()) = owner_id
    and (workspace_id is null or exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_id = (select auth.uid())
    ))
  );
create policy agent_tasks_update_own on public.agent_tasks
  for update to authenticated
  using (
    (select auth.uid()) = owner_id
    and (workspace_id is null or exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_id = (select auth.uid())
    ))
  )
  with check (
    (select auth.uid()) = owner_id
    and (workspace_id is null or exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_id = (select auth.uid())
    ))
  );
create policy agent_tasks_delete_own on public.agent_tasks
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy task_events_select_own on public.task_events
  for select to authenticated using (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.agent_tasks t
      where t.id = task_id and t.owner_id = (select auth.uid())
    )
  );
create policy task_events_insert_own on public.task_events
  for insert to authenticated with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.agent_tasks t
      where t.id = task_id and t.owner_id = (select auth.uid())
    )
  );

-- Client users may read their own audit records, but cannot forge or edit them.
create policy audit_logs_select_own on public.audit_logs
  for select to authenticated using ((select auth.uid()) = owner_id);

comment on table public.profiles is 'User-owned profile metadata; authentication identity is Supabase Auth.';
comment on table public.workspaces is 'Private workspaces owned by a single authenticated user.';
comment on table public.agent_tasks is 'Private task queue metadata; execution must be handled by a trusted worker.';
comment on table public.task_events is 'Append-only task event stream scoped to task owner.';
comment on table public.audit_logs is 'Audit trail; writes are reserved for trusted server-side service_role.';
