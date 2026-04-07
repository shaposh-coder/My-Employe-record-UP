-- Detect duplicate CNIC by digit sequence (ignores hyphens/spaces in stored values).

create or replace function public.employee_cnic_is_taken(
  p_cnic text,
  p_exclude_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.employees e
    where regexp_replace(coalesce(e.cnic_no, ''), '\D', '', 'g')
          = regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g')
      and length(regexp_replace(coalesce(p_cnic, ''), '\D', '', 'g')) = 13
      and (p_exclude_id is null or e.id <> p_exclude_id)
  );
$$;

grant execute on function public.employee_cnic_is_taken(text, uuid) to anon, authenticated, service_role;
