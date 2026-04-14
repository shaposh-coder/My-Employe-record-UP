-- Optional department scope: user only sees employees in this department (matches `departments.title` / `employees.department`).
alter table public.user_access add column if not exists allowed_department text;

comment on column public.user_access.allowed_department is
  'When set, dashboard and employee directory are limited to this department title. Empty/null = no restriction.';
