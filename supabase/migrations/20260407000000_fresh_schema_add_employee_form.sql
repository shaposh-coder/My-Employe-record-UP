-- =============================================================================
-- Employee Record — full schema for the Add Employee form (Supabase SQL Editor)
-- =============================================================================
-- Run once on a new project, or use the ALTER blocks to align an existing DB.
--
-- Covers:
--   • public.departments / public.sections (Configuration)
--   • public.employees (all fields the app inserts)
--   • RLS policies (open access — tighten for production with auth.uid())
--   • Storage bucket `employee-docs` + policies (profile/CNIC uploads)
--
-- If you already have an `employees` table with different columns, either:
--   (A) run the ALTER TABLE … ADD COLUMN IF NOT EXISTS section below, or
--   (B) backup data, uncomment DROP below, then run the full script.
-- =============================================================================

-- Optional: uncomment to replace `employees` completely (DESTRUCTIVE).
-- DROP TABLE IF EXISTS public.employees CASCADE;

-- -----------------------------------------------------------------------------
-- Helpers (used by departments / sections unique titles)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- Departments & sections
-- -----------------------------------------------------------------------------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_title_not_blank check (length(trim(title)) > 0)
);

create unique index if not exists departments_title_key_unique
  on public.departments (public.normalize_title_key(title));

drop trigger if exists departments_set_updated_at on public.departments;
create trigger departments_set_updated_at
  before update on public.departments
  for each row
  execute function public.set_updated_at();

alter table public.departments enable row level security;

drop policy if exists "departments_all" on public.departments;
create policy "departments_all"
  on public.departments
  for all
  using (true)
  with check (true);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sections_title_not_blank check (length(trim(title)) > 0)
);

create unique index if not exists sections_title_key_unique
  on public.sections (public.normalize_title_key(title));

drop trigger if exists sections_set_updated_at on public.sections;
create trigger sections_set_updated_at
  before update on public.sections
  for each row
  execute function public.set_updated_at();

alter table public.sections enable row level security;

drop policy if exists "sections_all" on public.sections;
create policy "sections_all"
  on public.sections
  for all
  using (true)
  with check (true);

-- -----------------------------------------------------------------------------
-- Employees (matches add-employee-form insert + select)
-- -----------------------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  father_name text,
  dob text,
  cnic_no text not null,
  ss_eubi_no text,
  phone_no text,
  city text,
  address text,
  department text not null,
  section text,
  status text not null default 'Active',
  education text,
  experience text,
  social_media_link text,
  social_links jsonb,
  email_address text,
  reference_info text,
  family_name text,
  family_father_name text,
  family_cnic text,
  family_phone text,
  family_phone_alt text,
  profile_image text not null,
  cnic_front text,
  cnic_back text,
  father_image text,
  father_cnic_front text,
  father_cnic_back text,
  other_documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_cnic_no_key unique (cnic_no)
);

-- Upgrade path: add any column missing on older databases
alter table public.employees add column if not exists full_name text;
alter table public.employees add column if not exists father_name text;
alter table public.employees add column if not exists dob text;
alter table public.employees add column if not exists cnic_no text;
alter table public.employees add column if not exists ss_eubi_no text;
alter table public.employees add column if not exists phone_no text;
alter table public.employees add column if not exists city text;
alter table public.employees add column if not exists address text;
alter table public.employees add column if not exists department text;
alter table public.employees add column if not exists section text;
alter table public.employees add column if not exists status text;
alter table public.employees add column if not exists education text;
alter table public.employees add column if not exists experience text;
alter table public.employees add column if not exists social_media_link text;
alter table public.employees add column if not exists social_links jsonb;
alter table public.employees add column if not exists email_address text;
alter table public.employees add column if not exists reference_info text;
alter table public.employees add column if not exists family_name text;
alter table public.employees add column if not exists family_father_name text;
alter table public.employees add column if not exists family_cnic text;
alter table public.employees add column if not exists family_phone text;
alter table public.employees add column if not exists family_phone_alt text;
alter table public.employees add column if not exists profile_image text;
alter table public.employees add column if not exists cnic_front text;
alter table public.employees add column if not exists cnic_back text;
alter table public.employees add column if not exists father_image text;
alter table public.employees add column if not exists father_cnic_front text;
alter table public.employees add column if not exists father_cnic_back text;
alter table public.employees add column if not exists other_documents jsonb;
alter table public.employees add column if not exists created_at timestamptz;
alter table public.employees add column if not exists updated_at timestamptz;

-- If `employees` already existed without CNIC uniqueness, add it after columns exist
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'employees'
      and t.relnamespace = (select oid from pg_namespace where nspname = 'public')
      and c.conname = 'employees_cnic_no_key'
  ) then
    alter table public.employees
      add constraint employees_cnic_no_key unique (cnic_no);
  end if;
exception
  when duplicate_object then null;
end $$;

-- Defaults / NOT NULL where the app always sends values
alter table public.employees
  alter column other_documents set default '[]'::jsonb;
update public.employees
  set other_documents = '[]'::jsonb
  where other_documents is null;
alter table public.employees
  alter column other_documents set not null;

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
  before update on public.employees
  for each row
  execute function public.set_updated_at();

comment on table public.employees is 'Employee directory — Add Employee form';
comment on column public.employees.social_links is 'Optional map: instagram, facebook, tiktok, youtube, snapchat, twitter → URL';
comment on column public.employees.other_documents is 'JSON array: [{ "url": text, "label": text }, …]';
comment on column public.employees.family_phone_alt is 'Father phone (alternate) — Family tab';

alter table public.employees enable row level security;

drop policy if exists "employees_all" on public.employees;
create policy "employees_all"
  on public.employees
  for all
  using (true)
  with check (true);

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant all on table public.departments to anon, authenticated, service_role;
grant all on table public.sections to anon, authenticated, service_role;
grant all on table public.employees to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Storage: public bucket `employee-docs` (see lib/storage/upload-employee-doc.ts)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('employee-docs', 'employee-docs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "employee-docs public read" on storage.objects;
create policy "employee-docs public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'employee-docs');

drop policy if exists "employee-docs public upload" on storage.objects;
create policy "employee-docs public upload"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'employee-docs');

drop policy if exists "employee-docs public update" on storage.objects;
create policy "employee-docs public update"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'employee-docs')
  with check (bucket_id = 'employee-docs');

drop policy if exists "employee-docs public delete" on storage.objects;
create policy "employee-docs public delete"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'employee-docs');
