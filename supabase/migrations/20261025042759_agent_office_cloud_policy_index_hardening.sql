-- Explicit deny policies make the intended service-role-only model clear to auditors.
-- Table privileges are also revoked from anon/authenticated; both controls are intentional.
create policy office_cloud_workspaces_deny_clients
  on public.office_cloud_workspaces for all to anon, authenticated
  using (false) with check (false);
create policy office_cloud_tasks_deny_clients
  on public.office_cloud_tasks for all to anon, authenticated
  using (false) with check (false);
create policy office_cloud_events_deny_clients
  on public.office_cloud_task_events for all to anon, authenticated
  using (false) with check (false);
create policy office_cloud_audit_deny_clients
  on public.office_cloud_audit_logs for all to anon, authenticated
  using (false) with check (false);

create index office_cloud_tasks_workspace_owner_fk_idx
  on public.office_cloud_tasks(workspace_id, owner_account_id);
create index office_cloud_events_task_owner_fk_idx
  on public.office_cloud_task_events(task_id, owner_account_id);
