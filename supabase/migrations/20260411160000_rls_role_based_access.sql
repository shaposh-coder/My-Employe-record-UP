-- Role-based RLS: viewer = read-only; manager/admin = write on directory + storage.
-- Relies on JWT email matching public.user_access.email (case-insensitive).

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

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- departments & sections
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- user_access (admin manages rows; everyone sees own row; admin sees all)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Storage: employee-docs
-- ---------------------------------------------------------------------------
drop policy if exists "employee-docs public read" on storage.objects;
drop policy if exists "employee-docs public upload" on storage.objects;
drop policy if exists "employee-docs public update" on storage.objects;
drop policy if exists "employee-docs public delete" on storage.objects;

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
