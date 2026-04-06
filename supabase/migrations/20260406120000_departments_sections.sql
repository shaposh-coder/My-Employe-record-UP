-- Run this in Supabase: SQL Editor → New query → Paste → Run
-- Or: supabase db push (if using Supabase CLI)

-- Matches app logic: trim, collapse whitespace, lowercase (duplicate detection)
create or replace function public.normalize_title_key(input text)
returns text
language sql
immutable
as $$
  select lower(trim(regexp_replace(coalesce(input, ''), '\s+', ' ', 'g')));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_title_not_blank check (length(trim(title)) > 0)
);

create unique index departments_title_key_unique
  on public.departments (public.normalize_title_key(title));

create trigger departments_set_updated_at
  before update on public.departments
  for each row
  execute function public.set_updated_at();

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sections_title_not_blank check (length(trim(title)) > 0)
);

create unique index sections_title_key_unique
  on public.sections (public.normalize_title_key(title));

create trigger sections_set_updated_at
  before update on public.sections
  for each row
  execute function public.set_updated_at();

alter table public.departments enable row level security;
alter table public.sections enable row level security;

-- Adjust policies for production (e.g. auth.uid() checks) as needed.
create policy "departments_all"
  on public.departments
  for all
  using (true)
  with check (true);

create policy "sections_all"
  on public.sections
  for all
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated, service_role;

grant all on table public.departments to anon, authenticated, service_role;
grant all on table public.sections to anon, authenticated, service_role;
