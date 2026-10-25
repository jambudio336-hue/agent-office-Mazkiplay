-- Keep updated_at trustworthy without exposing a callable helper in the public schema.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function app_private.set_updated_at();

create trigger agent_tasks_set_updated_at
before update on public.agent_tasks
for each row execute function app_private.set_updated_at();
