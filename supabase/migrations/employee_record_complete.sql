-- =============================================================================
-- Employee Record — complete schema + default admin (single migration)
-- =============================================================================
-- Run: Supabase Dashboard → SQL → New query → paste → Run
--   or: supabase db push / supabase db reset (CLI)
--
-- Default login (change password after first sign-in in production):
--   Email:    admin@admin.com
--   Password: admin123
--   Role:     admin
--
-- Password is stored only as bcrypt in auth.users.encrypted_password (pgcrypto).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- -----------------------------------------------------------------------------
-- Helpers
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
-- Departments
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

-- -----------------------------------------------------------------------------
-- Sections (per department)
-- -----------------------------------------------------------------------------
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sections_title_not_blank check (length(trim(title)) > 0)
);

drop index if exists public.sections_title_key_unique;

create unique index if not exists sections_department_title_key_unique
  on public.sections (department_id, public.normalize_title_key (title));

drop trigger if exists sections_set_updated_at on public.sections;
create trigger sections_set_updated_at
  before update on public.sections
  for each row
  execute function public.set_updated_at();

alter table public.sections enable row level security;

-- -----------------------------------------------------------------------------
-- Employees
-- -----------------------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  father_name text,
  dob text,
  cnic_no text not null,
  ss_eubi_no text,
  basic_salary text,
  phone_no text,
  city text,
  address text,
  department text not null,
  section text,
  date_of_joining text,
  date_of_resign text,
  designation text,
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
  constraint employees_cnic_no_key unique (cnic_no),
  constraint employees_status_check check (status in ('Active', 'Un-Active'))
);

alter table public.employees add column if not exists full_name text;
alter table public.employees add column if not exists father_name text;
alter table public.employees add column if not exists dob text;
alter table public.employees add column if not exists cnic_no text;
alter table public.employees add column if not exists ss_eubi_no text;
alter table public.employees add column if not exists basic_salary text;
alter table public.employees add column if not exists phone_no text;
alter table public.employees add column if not exists city text;
alter table public.employees add column if not exists address text;
alter table public.employees add column if not exists department text;
alter table public.employees add column if not exists section text;
alter table public.employees add column if not exists date_of_joining text;
alter table public.employees add column if not exists date_of_resign text;
alter table public.employees add column if not exists designation text;
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

alter table public.employees
  alter column other_documents set default '[]'::jsonb;
update public.employees
  set other_documents = '[]'::jsonb
  where other_documents is null;
alter table public.employees
  alter column other_documents set not null;

update public.employees
  set status = 'Un-Active'
  where status = 'Deactive';

alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check
  check (status in ('Active', 'Un-Active'));

comment on column public.employees.status is 'Active or Un-Active — employee lifecycle';

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

-- -----------------------------------------------------------------------------
-- User access (Settings)
-- -----------------------------------------------------------------------------
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

alter table public.user_access
  add column if not exists auth_user_id uuid;

alter table public.user_access
  add column if not exists avatar_url text not null default '';

alter table public.user_access
  add column if not exists allowed_department text;

comment on column public.user_access.allowed_department is 'When set, user only sees employees in this department (title match). Null/empty = all departments.';
comment on column public.user_access.auth_user_id is 'auth.users.id when this row was created with login; null for legacy rows.';
comment on column public.user_access.avatar_url is 'Public URL for optional profile photo (e.g. employee-docs bucket).';

create unique index if not exists user_access_email_lower_unique
  on public.user_access (lower(trim(email)));

create unique index if not exists user_access_auth_user_id_unique
  on public.user_access (auth_user_id)
  where auth_user_id is not null;

drop trigger if exists user_access_set_updated_at on public.user_access;
create trigger user_access_set_updated_at
  before update on public.user_access
  for each row
  execute function public.set_updated_at();

alter table public.user_access enable row level security;

comment on table public.user_access is 'App users and access level (admin / manager / viewer).';

-- -----------------------------------------------------------------------------
-- Indexes (directory)
-- -----------------------------------------------------------------------------
create index if not exists idx_employees_created_at_desc
  on public.employees (created_at desc nulls last);

create index if not exists idx_employees_department
  on public.employees (department);

create index if not exists idx_employees_section
  on public.employees (section);

create index if not exists idx_employees_city
  on public.employees (city);

create index if not exists idx_employees_phone_no
  on public.employees (phone_no);

create index if not exists idx_employees_full_name_trgm
  on public.employees using gin (full_name gin_trgm_ops);

create index if not exists idx_employees_phone_no_trgm
  on public.employees using gin (phone_no gin_trgm_ops);

create index if not exists idx_employees_cnic_no_trgm
  on public.employees using gin (cnic_no gin_trgm_ops);

create index if not exists idx_employees_city_trgm
  on public.employees using gin (city gin_trgm_ops);

create index if not exists idx_employees_department_trgm
  on public.employees using gin (department gin_trgm_ops);

create index if not exists idx_employees_section_trgm
  on public.employees using gin (section gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- RPCs
-- -----------------------------------------------------------------------------
create or replace function public.department_employee_counts()
returns table (dept_id uuid, employee_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.id as dept_id,
    count(e.id)::bigint as employee_count
  from public.departments d
  left join public.employees e
    on public.normalize_title_key(coalesce(e.department, ''))
     = public.normalize_title_key(d.title)
  group by d.id;
$$;

create or replace function public.section_employee_counts()
returns table (section_id uuid, employee_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.id as section_id,
    count(e.id)::bigint as employee_count
  from public.sections s
  left join public.employees e
    on public.normalize_title_key(coalesce(e.section, ''))
     = public.normalize_title_key(s.title)
  group by s.id;
$$;

grant execute on function public.department_employee_counts() to anon, authenticated, service_role;
grant execute on function public.section_employee_counts() to anon, authenticated, service_role;

create or replace function public.employee_cnic_is_taken(
  p_cnic text,
  p_exclude_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.employees e
    where regexp_replace(coalesce(e.cnic_no, ''), '\D', '', 'g')
          = regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g')
      and length(regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g')) = 13
      and (p_exclude_id is null or e.id <> p_exclude_id)
  );
$$;

grant execute on function public.employee_cnic_is_taken(text, uuid) to anon, authenticated, service_role;

create or replace function public.get_employee_distinct_cities()
returns table (city text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct btrim(e.city)::text as city
  from public.employees e
  where e.city is not null
    and btrim(e.city) <> ''
  order by 1;
$$;

grant execute on function public.get_employee_distinct_cities() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Role helpers (RLS)
-- -----------------------------------------------------------------------------
create or replace function public.app_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ua.access_role::text
  from public.user_access ua
  where lower(trim(ua.email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
  limit 1;
$$;

revoke all on function public.app_user_role() from public;
grant execute on function public.app_user_role() to authenticated;

create or replace function public.app_can_write_directory()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.app_user_role() in ('admin', 'manager');
$$;

revoke all on function public.app_can_write_directory() from public;
grant execute on function public.app_can_write_directory() to authenticated;

create or replace function public.update_my_profile(
  p_full_name text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_access
  set
    full_name = case
      when trim(coalesce(p_full_name, '')) = '' then full_name
      else trim(p_full_name)
    end,
    avatar_url = trim(coalesce(p_avatar_url, '')),
    updated_at = now()
  where lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')));
end;
$$;

revoke all on function public.update_my_profile(text, text) from public;
grant execute on function public.update_my_profile(text, text) to authenticated;

create or replace function public.apply_department_update_sync_employees(
  p_id uuid,
  p_new_title text,
  p_new_description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_title text;
  n int := 0;
  v_title text;
  v_desc text;
begin
  if not public.app_can_write_directory() then
    raise exception 'forbidden';
  end if;

  v_title := trim(regexp_replace(coalesce(p_new_title, ''), '\s+', ' ', 'g'));
  v_desc := coalesce(p_new_description, '');

  select d.title into strict v_old_title
  from public.departments d
  where d.id = p_id
  for update;

  if public.normalize_title_key(v_old_title) is distinct from public.normalize_title_key(v_title) then
    update public.employees e
    set
      department = v_title,
      updated_at = now()
    where public.normalize_title_key(coalesce(e.department, ''))
        = public.normalize_title_key(coalesce(v_old_title, ''));

    get diagnostics n = row_count;
  end if;

  update public.departments
  set
    title = v_title,
    description = v_desc,
    updated_at = now()
  where id = p_id;

  return n;
end;
$$;

revoke all on function public.apply_department_update_sync_employees(uuid, text, text) from public;
grant execute on function public.apply_department_update_sync_employees(uuid, text, text) to authenticated;

create or replace function public.apply_section_update_sync_employees(
  p_id uuid,
  p_new_title text,
  p_new_description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_title text;
  n int := 0;
  v_title text;
  v_desc text;
begin
  if not public.app_can_write_directory() then
    raise exception 'forbidden';
  end if;

  v_title := trim(regexp_replace(coalesce(p_new_title, ''), '\s+', ' ', 'g'));
  v_desc := coalesce(p_new_description, '');

  select s.title into strict v_old_title
  from public.sections s
  where s.id = p_id
  for update;

  if public.normalize_title_key(v_old_title) is distinct from public.normalize_title_key(v_title) then
    update public.employees e
    set
      section = v_title,
      updated_at = now()
    where public.normalize_title_key(coalesce(e.section, ''))
        = public.normalize_title_key(coalesce(v_old_title, ''));

    get diagnostics n = row_count;
  end if;

  update public.sections
  set
    title = v_title,
    description = v_desc,
    updated_at = now()
  where id = p_id;

  return n;
end;
$$;

revoke all on function public.apply_section_update_sync_employees(uuid, text, text) from public;
grant execute on function public.apply_section_update_sync_employees(uuid, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- RLS policies (public)
-- -----------------------------------------------------------------------------
drop policy if exists "employees_all" on public.employees;

create policy "employees_select_authenticated"
  on public.employees
  for select
  to authenticated
  using (public.app_user_role() is not null);

create policy "employees_insert_writers"
  on public.employees
  for insert
  to authenticated
  with check (public.app_can_write_directory());

create policy "employees_update_writers"
  on public.employees
  for update
  to authenticated
  using (public.app_can_write_directory())
  with check (public.app_can_write_directory());

create policy "employees_delete_writers"
  on public.employees
  for delete
  to authenticated
  using (public.app_can_write_directory());

drop policy if exists "departments_all" on public.departments;

create policy "departments_select_authenticated"
  on public.departments
  for select
  to authenticated
  using (public.app_user_role() is not null);

create policy "departments_insert_writers"
  on public.departments
  for insert
  to authenticated
  with check (public.app_can_write_directory());

create policy "departments_update_writers"
  on public.departments
  for update
  to authenticated
  using (public.app_can_write_directory())
  with check (public.app_can_write_directory());

create policy "departments_delete_writers"
  on public.departments
  for delete
  to authenticated
  using (public.app_can_write_directory());

drop policy if exists "sections_all" on public.sections;

create policy "sections_select_authenticated"
  on public.sections
  for select
  to authenticated
  using (public.app_user_role() is not null);

create policy "sections_insert_writers"
  on public.sections
  for insert
  to authenticated
  with check (public.app_can_write_directory());

create policy "sections_update_writers"
  on public.sections
  for update
  to authenticated
  using (public.app_can_write_directory())
  with check (public.app_can_write_directory());

create policy "sections_delete_writers"
  on public.sections
  for delete
  to authenticated
  using (public.app_can_write_directory());

drop policy if exists "user_access_all" on public.user_access;

create policy "user_access_select"
  on public.user_access
  for select
  to authenticated
  using (
    public.app_user_role() = 'admin'
    or lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
  );

create policy "user_access_update_admin"
  on public.user_access
  for update
  to authenticated
  using (public.app_user_role() = 'admin')
  with check (public.app_user_role() = 'admin');

create policy "user_access_insert_block"
  on public.user_access
  for insert
  to authenticated
  with check (false);

create policy "user_access_delete_block"
  on public.user_access
  for delete
  to authenticated
  using (false);

-- -----------------------------------------------------------------------------
-- Storage: employee-docs
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('employee-docs', 'employee-docs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "employee-docs public read" on storage.objects;
drop policy if exists "employee-docs public upload" on storage.objects;
drop policy if exists "employee-docs public update" on storage.objects;
drop policy if exists "employee-docs public delete" on storage.objects;

drop policy if exists "employee-docs_select_authenticated" on storage.objects;
drop policy if exists "employee-docs_insert_writers" on storage.objects;
drop policy if exists "employee-docs_update_writers" on storage.objects;
drop policy if exists "employee-docs_delete_writers" on storage.objects;

create policy "employee-docs_select_authenticated"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
  );

create policy "employee-docs_insert_writers"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'employee-docs'
    and public.app_can_write_directory()
  );

create policy "employee-docs_update_writers"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'employee-docs'
    and public.app_can_write_directory()
  )
  with check (
    bucket_id = 'employee-docs'
    and public.app_can_write_directory()
  );

create policy "employee-docs_delete_writers"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'employee-docs'
    and public.app_can_write_directory()
  );

drop policy if exists "employee-docs_user_avatar_insert" on storage.objects;
drop policy if exists "employee-docs_user_avatar_update" on storage.objects;
drop policy if exists "employee-docs_user_avatar_delete" on storage.objects;

create policy "employee-docs_user_avatar_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  );

create policy "employee-docs_user_avatar_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  );

create policy "employee-docs_user_avatar_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  );

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant all on table public.departments to anon, authenticated, service_role;
grant all on table public.sections to anon, authenticated, service_role;
grant all on table public.employees to anon, authenticated, service_role;
grant all on table public.user_access to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Default admin: auth.users + auth.identities + public.user_access
-- Password is bcrypt only (crypt + gen_salt). Idempotent if email exists.
-- -----------------------------------------------------------------------------
do $$
declare
  v_instance_id uuid;
  v_user_id uuid := gen_random_uuid();
  v_email text := 'admin@admin.com';
  v_encrypted_pw text := crypt('admin123', gen_salt('bf'));
begin
  if exists (
    select 1 from auth.users where lower(email) = lower(v_email)
  ) then
    return;
  end if;

  select id into v_instance_id from auth.instances limit 1;
  if v_instance_id is null then
    v_instance_id := '00000000-0000-0000-0000-000000000000'::uuid;
  end if;

  -- Token columns must be '' not NULL or GoTrue returns "Database error querying schema" on login
  -- (see https://github.com/supabase/auth/issues/1940 )
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    v_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Admin'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  insert into public.user_access (
    email,
    full_name,
    access_role,
    notes,
    auth_user_id
  )
  values (
    v_email,
    'Admin',
    'admin',
    'Seeded default admin — change password after first login.',
    v_user_id
  );
end $$;
