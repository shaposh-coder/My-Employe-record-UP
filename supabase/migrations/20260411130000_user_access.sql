-- Users & access (Settings page) — directory of who may use the app and their role.
-- RLS matches other public tables in this project (open; tighten with auth later).

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null default '',
  access_role text not null default 'viewer'
    constraint user_access_role_check
      check (access_role in ('admin', 'manager', 'viewer')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_access_email_not_blank check (length(trim(email)) > 0)
);

create unique index if not exists user_access_email_lower_unique
  on public.user_access (lower(trim(email)));

drop trigger if exists user_access_set_updated_at on public.user_access;
create trigger user_access_set_updated_at
  before update on public.user_access
  for each row
  execute function public.set_updated_at();

alter table public.user_access enable row level security;

drop policy if exists "user_access_all" on public.user_access;
create policy "user_access_all"
  on public.user_access
  for all
  using (true)
  with check (true);

comment on table public.user_access is 'App users and access level (admin / manager / viewer).';
