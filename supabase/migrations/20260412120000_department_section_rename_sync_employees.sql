-- When a department or section title is renamed, keep employees in sync by updating
-- `employees.department` / `employees.section` for all rows whose stored text matches
-- the old title (same normalization as unique keys). Runs in one transaction with the
-- directory row update.

create or replace function public.apply_department_update_sync_employees(
  p_id uuid,
  p_new_title text,
  p_new_description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_title text;
  n int := 0;
  v_title text;
  v_desc text;
begin
  if not public.app_can_write_directory() then
    raise exception 'forbidden';
  end if;

  v_title := trim(regexp_replace(coalesce(p_new_title, ''), '\s+', ' ', 'g'));
  v_desc := coalesce(p_new_description, '');

  select d.title into strict v_old_title
  from public.departments d
  where d.id = p_id
  for update;

  if public.normalize_title_key(v_old_title) is distinct from public.normalize_title_key(v_title) then
    update public.employees e
    set
      department = v_title,
      updated_at = now()
    where public.normalize_title_key(coalesce(e.department, ''))
        = public.normalize_title_key(coalesce(v_old_title, ''));

    get diagnostics n = row_count;
  end if;

  update public.departments
  set
    title = v_title,
    description = v_desc,
    updated_at = now()
  where id = p_id;

  return n;
end;
$$;

revoke all on function public.apply_department_update_sync_employees(uuid, text, text) from public;
grant execute on function public.apply_department_update_sync_employees(uuid, text, text) to authenticated;

create or replace function public.apply_section_update_sync_employees(
  p_id uuid,
  p_new_title text,
  p_new_description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_title text;
  n int := 0;
  v_title text;
  v_desc text;
begin
  if not public.app_can_write_directory() then
    raise exception 'forbidden';
  end if;

  v_title := trim(regexp_replace(coalesce(p_new_title, ''), '\s+', ' ', 'g'));
  v_desc := coalesce(p_new_description, '');

  select s.title into strict v_old_title
  from public.sections s
  where s.id = p_id
  for update;

  if public.normalize_title_key(v_old_title) is distinct from public.normalize_title_key(v_title) then
    update public.employees e
    set
      section = v_title,
      updated_at = now()
    where public.normalize_title_key(coalesce(e.section, ''))
        = public.normalize_title_key(coalesce(v_old_title, ''));

    get diagnostics n = row_count;
  end if;

  update public.sections
  set
    title = v_title,
    description = v_desc,
    updated_at = now()
  where id = p_id;

  return n;
end;
$$;

revoke all on function public.apply_section_update_sync_employees(uuid, text, text) from public;
grant execute on function public.apply_section_update_sync_employees(uuid, text, text) to authenticated;
