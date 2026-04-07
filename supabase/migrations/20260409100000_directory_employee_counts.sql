-- Per-row employee counts for Configuration (departments / sections).
-- Matches app semantics: public.normalize_title_key(employees.field) = normalize_title_key(directory.title)

create or replace function public.department_employee_counts()
returns table (dept_id uuid, employee_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.id as dept_id,
    count(e.id)::bigint as employee_count
  from public.departments d
  left join public.employees e
    on public.normalize_title_key(coalesce(e.department, ''))
     = public.normalize_title_key(d.title)
  group by d.id;
$$;

create or replace function public.section_employee_counts()
returns table (section_id uuid, employee_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.id as section_id,
    count(e.id)::bigint as employee_count
  from public.sections s
  left join public.employees e
    on public.normalize_title_key(coalesce(e.section, ''))
     = public.normalize_title_key(s.title)
  group by s.id;
$$;

grant execute on function public.department_employee_counts() to anon, authenticated, service_role;
grant execute on function public.section_employee_counts() to anon, authenticated, service_role;
