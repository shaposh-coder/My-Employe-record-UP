-- -----------------------------------------------------------------------------
-- Employee timeline entries (dated observations per employee; history retained)
-- -----------------------------------------------------------------------------

create table if not exists public.employee_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null
    references public.employees (id) on delete cascade,
  entry_date date not null,
  created_at timestamptz not null default now(),
  punctuality text,
  punctuality_comment text not null default '',
  behaviour text,
  behaviour_comment text not null default '',
  honesty text,
  criminal_misconduct text,
  dressing_appearance_comment text not null default '',
  effort text,
  others text not null default '',
  constraint employee_timeline_punctuality_chk
    check (punctuality is null or punctuality in ('yes', 'no')),
  constraint employee_timeline_behaviour_chk
    check (behaviour is null or behaviour in ('professional', 'non_professional')),
  constraint employee_timeline_honesty_chk
    check (honesty is null or honesty in ('yes', 'no')),
  constraint employee_timeline_criminal_chk
    check (criminal_misconduct is null or criminal_misconduct in ('yes', 'no')),
  constraint employee_timeline_effort_chk
    check (effort is null or effort in ('hard_work', 'inactive'))
);

comment on table public.employee_timeline_entries is
  'Per-date timeline notes for an employee; multiple rows per employee over time.';

create index if not exists employee_timeline_entries_employee_date_created_idx
  on public.employee_timeline_entries (employee_id, entry_date desc, created_at desc);

alter table public.employee_timeline_entries enable row level security;

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
  using (public.app_user_role() is not null);

create policy "employee_timeline_entries_insert_writers"
  on public.employee_timeline_entries
  for insert
  to authenticated
  with check (public.app_can_write_directory());

create policy "employee_timeline_entries_update_writers"
  on public.employee_timeline_entries
  for update
  to authenticated
  using (public.app_can_write_directory())
  with check (public.app_can_write_directory());

create policy "employee_timeline_entries_delete_writers"
  on public.employee_timeline_entries
  for delete
  to authenticated
  using (public.app_can_write_directory());

grant all on table public.employee_timeline_entries to anon, authenticated, service_role;
