alter table public.employee_timeline_entries
  add column if not exists added_by_name text;

comment on column public.employee_timeline_entries.added_by_name is
  'Display name from user_access.full_name when the row was inserted; falls back to email in UI if null.';

-- Backfill from Settings → Users list where email matches.
update public.employee_timeline_entries e
set added_by_name = btrim(ua.full_name)
from public.user_access ua
where lower(trim(ua.email)) = lower(trim(e.added_by_email))
  and (e.added_by_name is null or btrim(coalesce(e.added_by_name, '')) = '')
  and btrim(coalesce(ua.full_name, '')) <> '';
