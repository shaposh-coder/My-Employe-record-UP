-- Replace legacy status value "Deactive" with "Un-Active" (label + constraint).

update public.employees
  set status = 'Un-Active'
  where status = 'Deactive';

alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check
  check (status in ('Active', 'Un-Active'));

comment on column public.employees.status is 'Active or Un-Active — employee lifecycle';
