-- Cloud records for Agent Office's existing local-account auth model.
-- The app's current Accounts IDs are local opaque strings, not Supabase Auth UUIDs.
-- Therefore these tables are service-role-only and are accessed only after the Node server
-- validates the existing signed office session. Never expose the secret key to clients.

create table public.office_cloud_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_account_id text not null check (char_length(owner_account_id) between 1 and 128),
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_account_id)
);

create table public.office_cloud_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_account_id text not null check (char_length(owner_account_id) between 1 and 128),
  workspace_id uuid,
  title text not null check (char_length(trim(title)) between 1 and 200),
  prompt text not null default '' check (char_length(prompt) <= 20000),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','cancelled')),
  priority smallint not null default 3 check (priority between 1 and 5),
  result_summary text not null default '' check (char_length(result_summary) <= 10000),
  error_summary text not null default '' check (char_length(error_summary) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint office_cloud_tasks_owner_workspace_fk
    foreign key (workspace_id, owner_account_id)
    references public.office_cloud_workspaces(id, owner_account_id)
    on delete set null (workspace_id)
);

create table public.office_cloud_task_events (
  id bigint generated always as identity primary key,
  task_id uuid not null,
  owner_account_id text not null,
  event_type text not null check (char_length(trim(event_type)) between 1 and 80),
  message text not null default '' check (char_length(message) <= 10000),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint office_cloud_events_owner_task_fk
    foreign key (task_id, owner_account_id)
    references public.office_cloud_tasks(id, owner_account_id)
    on delete cascade
);

create table public.office_cloud_audit_logs (
  id bigint generated always as identity primary key,
  owner_account_id text,
  actor_account_id text,
  action text not null check (char_length(trim(action)) between 1 and 120),
  resource_type text not null default 'system' check (char_length(resource_type) <= 80),
  resource_id text,
  outcome text not null default 'success' check (outcome in ('success','denied','error')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index office_cloud_workspaces_owner_created_idx
  on public.office_cloud_workspaces(owner_account_id, created_at desc);
create index office_cloud_tasks_owner_status_created_idx
  on public.office_cloud_tasks(owner_account_id, status, created_at desc);
create index office_cloud_tasks_workspace_idx
  on public.office_cloud_tasks(workspace_id) where workspace_id is not null;
create index office_cloud_events_task_created_idx
  on public.office_cloud_task_events(task_id, created_at desc);
create index office_cloud_audit_owner_created_idx
  on public.office_cloud_audit_logs(owner_account_id, created_at desc);

alter table public.office_cloud_workspaces enable row level security;
alter table public.office_cloud_tasks enable row level security;
alter table public.office_cloud_task_events enable row level security;
alter table public.office_cloud_audit_logs enable row level security;

revoke all on public.office_cloud_workspaces, public.office_cloud_tasks,
  public.office_cloud_task_events, public.office_cloud_audit_logs from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant all on public.office_cloud_workspaces, public.office_cloud_tasks,
  public.office_cloud_task_events, public.office_cloud_audit_logs to service_role;
grant usage, select on all sequences in schema public to service_role;

alter table public.office_cloud_workspaces
  add constraint office_cloud_workspaces_name_not_empty check (char_length(trim(name)) > 0);
alter table public.office_cloud_tasks
  add constraint office_cloud_tasks_title_not_empty check (char_length(trim(title)) > 0);

comment on table public.office_cloud_workspaces is
  'Private cloud workspace records keyed to an Agent Office local account ID; service-role-only API.';
comment on table public.office_cloud_tasks is
  'Cloud task metadata only. This table does not execute jobs; trusted worker runtime is separate.';
comment on table public.office_cloud_task_events is
  'Cloud task event history; writes are reserved for trusted server code.';
comment on table public.office_cloud_audit_logs is
  'Cloud audit log; writes are reserved for trusted server code.';
