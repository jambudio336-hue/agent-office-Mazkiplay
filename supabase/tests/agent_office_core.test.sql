-- Lightweight catalog/security regression checks for Agent Office.
-- Run with: supabase test db
begin;

do $$
declare
  t text;
  missing_rls text;
  exposed_to_anon text;
begin
  foreach t in array array['profiles','workspaces','agent_tasks','task_events','audit_logs'] loop
    if to_regclass('public.' || t) is null then
      raise exception 'Required table public.% is missing', t;
    end if;
    if not (select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.' || t)) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
    if has_table_privilege('anon', 'public.' || t, 'SELECT')
       or has_table_privilege('anon', 'public.' || t, 'INSERT')
       or has_table_privilege('anon', 'public.' || t, 'UPDATE')
       or has_table_privilege('anon', 'public.' || t, 'DELETE') then
      raise exception 'Anonymous role has a direct table privilege on public.%', t;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.audit_logs', 'INSERT')
     or has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE')
     or has_table_privilege('authenticated', 'public.audit_logs', 'DELETE') then
    raise exception 'Authenticated role can modify audit_logs';
  end if;

  if has_table_privilege('authenticated', 'public.task_events', 'UPDATE')
     or has_table_privilege('authenticated', 'public.task_events', 'DELETE') then
    raise exception 'Authenticated role can edit/delete append-only task_events';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='workspaces'
      and policyname='workspaces_select_own' and 'authenticated'=any(roles)
  ) then
    raise exception 'Workspace owner SELECT policy missing';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='agent_tasks'
      and policyname='agent_tasks_insert_own' and 'authenticated'=any(roles)
  ) then
    raise exception 'Task owner INSERT policy missing';
  end if;
end $$;

rollback;
