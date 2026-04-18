alter table public.employee_timeline_entries
  add column if not exists updated_by_email text;

alter table public.employee_timeline_entries
  add column if not exists updated_by_name text;

comment on column public.employee_timeline_entries.updated_by_email is
  'Email of the user who last updated this row; set on each successful update.';

comment on column public.employee_timeline_entries.updated_by_name is
  'Display name from user_access at update time.';
