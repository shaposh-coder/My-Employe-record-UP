-- Employee status (Active / Deactive) — Add Employee form + directory table

alter table public.employees
  add column if not exists status text not null default 'Active';

alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check
  check (status in ('Active', 'Deactive'));

comment on column public.employees.status is 'Active or Deactive — employee lifecycle';
