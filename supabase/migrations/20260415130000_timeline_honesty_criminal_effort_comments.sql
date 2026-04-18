alter table public.employee_timeline_entries
  add column if not exists honesty_comment text not null default '';

alter table public.employee_timeline_entries
  add column if not exists criminal_misconduct_comment text not null default '';

alter table public.employee_timeline_entries
  add column if not exists effort_comment text not null default '';

comment on column public.employee_timeline_entries.honesty_comment is
  'Optional note alongside Honesty Yes/No.';
comment on column public.employee_timeline_entries.criminal_misconduct_comment is
  'Optional note alongside Criminal / Misconduct Yes/No.';
comment on column public.employee_timeline_entries.effort_comment is
  'Optional note alongside Effort / Work ethic selection.';
