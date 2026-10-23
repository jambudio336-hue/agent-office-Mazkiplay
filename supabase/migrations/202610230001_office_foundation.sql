create extension if not exists pgcrypto;

create table if not exists public.office_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Founder',
  language text not null default 'id' check (language in ('id','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.office_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  office_name text not null default 'Mazkiplay Agent Office',
  theme text not null default 'dark',
  max_workers integer not null default 20 check (max_workers between 1 and 20),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.office_workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'AI Worker',
  provider text not null default 'openrouter',
  model text not null default '',
  status text not null default 'idle' check (status in ('idle','working','waiting','done','error','paused')),
  appearance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists office_workers_user_idx on public.office_workers(user_id, created_at);

create or replace function public.enforce_office_worker_limit()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (select count(*) from public.office_workers where user_id = new.user_id) >= 20 then
    raise exception 'Batas maksimal 20 pekerja AI per kantor telah tercapai';
  end if;
  return new;
end;
$$;
drop trigger if exists office_worker_limit_before_insert on public.office_workers;
create trigger office_worker_limit_before_insert before insert on public.office_workers
for each row execute function public.enforce_office_worker_limit();

create table if not exists public.office_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  worker_id uuid references public.office_workers(id) on delete set null,
  title text not null,
  prompt text not null default '',
  status text not null default 'queued' check (status in ('queued','running','blocked','completed','failed','cancelled')),
  priority integer not null default 3 check (priority between 1 and 5),
  result_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists office_tasks_user_status_idx on public.office_tasks(user_id, status, created_at desc);

create table if not exists public.office_provider_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('openrouter','openai','google','deepseek','anthropic','other')),
  model text not null,
  label text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, provider, model)
);

alter table public.office_profiles enable row level security;
alter table public.office_settings enable row level security;
alter table public.office_workers enable row level security;
alter table public.office_tasks enable row level security;
alter table public.office_provider_preferences enable row level security;

create policy "profile owner access" on public.office_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings owner access" on public.office_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workers owner access" on public.office_workers for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks owner access" on public.office_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "provider preferences owner access" on public.office_provider_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.office_profiles to authenticated;
grant select, insert, update, delete on public.office_settings to authenticated;
grant select, insert, update, delete on public.office_workers to authenticated;
grant select, insert, update, delete on public.office_tasks to authenticated;
grant select, insert, update, delete on public.office_provider_preferences to authenticated;
