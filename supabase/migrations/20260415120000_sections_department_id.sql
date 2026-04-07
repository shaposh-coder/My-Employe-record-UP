-- Sections belong to a department; titles are unique per department (not globally).

alter table public.sections
  add column if not exists department_id uuid references public.departments (id) on delete cascade;

-- Existing rows: attach to the first department (by title) when possible.
update public.sections s
set department_id = (select d.id from public.departments d order by d.title limit 1)
where s.department_id is null
  and exists (select 1 from public.departments);

-- Orphan section rows (no department in DB) cannot satisfy NOT NULL — remove them.
delete from public.sections where department_id is null;

alter table public.sections alter column department_id set not null;

drop index if exists public.sections_title_key_unique;

create unique index sections_department_title_key_unique
  on public.sections (department_id, public.normalize_title_key (title));
