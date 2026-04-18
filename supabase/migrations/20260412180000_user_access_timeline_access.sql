-- Timeline access flag per user (manager/viewer); admin bypasses in app + RLS helpers.

alter table public.user_access
  add column if not exists timeline_access boolean not null default false;

comment on column public.user_access.timeline_access is
  'When true, manager/viewer may view employee timelines; managers may also add entries. Admins ignore this column (full access).';

-- Existing rows: match prior behavior (timeline was visible to all authenticated roles).
update public.user_access
set timeline_access = true;

-- ---------------------------------------------------------------------------
-- RLS helpers for employee_timeline_entries
-- ---------------------------------------------------------------------------
create or replace function public.app_user_timeline_access_flag()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select ua.timeline_access
    from public.user_access ua
    where lower(trim(ua.email)) = lower(trim(coalesce(auth.jwt()->>'email', '')))
    limit 1
  ), false);
$$;

revoke all on function public.app_user_timeline_access_flag() from public;
grant execute on function public.app_user_timeline_access_flag() to authenticated;

create or replace function public.app_can_view_timeline()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case public.app_user_role()
      when 'admin' then true
      when 'manager' then public.app_user_timeline_access_flag()
      when 'viewer' then public.app_user_timeline_access_flag()
      else false
    end;
$$;

revoke all on function public.app_can_view_timeline() from public;
grant execute on function public.app_can_view_timeline() to authenticated;

create or replace function public.app_can_edit_timeline()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case public.app_user_role()
      when 'admin' then true
      when 'manager' then public.app_user_timeline_access_flag()
      else false
    end;
$$;

revoke all on function public.app_can_edit_timeline() from public;
grant execute on function public.app_can_edit_timeline() to authenticated;

drop policy if exists "employee_timeline_entries_select_authenticated"
  on public.employee_timeline_entries;
drop policy if exists "employee_timeline_entries_insert_writers"
  on public.employee_timeline_entries;
drop policy if exists "employee_timeline_entries_update_writers"
  on public.employee_timeline_entries;
drop policy if exists "employee_timeline_entries_delete_writers"
  on public.employee_timeline_entries;

create policy "employee_timeline_entries_select_authenticated"
  on public.employee_timeline_entries
  for select
  to authenticated
  using (public.app_can_view_timeline());

create policy "employee_timeline_entries_insert_writers"
  on public.employee_timeline_entries
  for insert
  to authenticated
  with check (public.app_can_edit_timeline());

create policy "employee_timeline_entries_update_writers"
  on public.employee_timeline_entries
  for update
  to authenticated
  using (public.app_can_edit_timeline())
  with check (public.app_can_edit_timeline());

create policy "employee_timeline_entries_delete_writers"
  on public.employee_timeline_entries
  for delete
  to authenticated
  using (public.app_can_edit_timeline());
