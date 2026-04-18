-- Who saved this timeline row (session email at insert time).

alter table public.employee_timeline_entries
  add column if not exists added_by_email text;

comment on column public.employee_timeline_entries.added_by_email is
  'Email of the signed-in user when this row was inserted; null for legacy rows.';
