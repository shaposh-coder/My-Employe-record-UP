-- Indexes for large employee directories: filters, sort, and ILIKE search.
-- Apply after the base employees schema exists.

-- List ordering (newest first) — used by every directory query
create index if not exists idx_employees_created_at_desc
  on public.employees (created_at desc nulls last);

-- Exact match filters from the toolbar
create index if not exists idx_employees_department
  on public.employees (department);

create index if not exists idx_employees_section
  on public.employees (section);

create index if not exists idx_employees_city
  on public.employees (city);

-- Helpful for lookups (CNIC is unique; phone often filtered)
create index if not exists idx_employees_phone_no
  on public.employees (phone_no);

-- Substring / ILIKE search — requires pg_trgm (available on Supabase)
create extension if not exists pg_trgm;

create index if not exists idx_employees_full_name_trgm
  on public.employees using gin (full_name gin_trgm_ops);

create index if not exists idx_employees_phone_no_trgm
  on public.employees using gin (phone_no gin_trgm_ops);

create index if not exists idx_employees_cnic_no_trgm
  on public.employees using gin (cnic_no gin_trgm_ops);

create index if not exists idx_employees_city_trgm
  on public.employees using gin (city gin_trgm_ops);

create index if not exists idx_employees_department_trgm
  on public.employees using gin (department gin_trgm_ops);

create index if not exists idx_employees_section_trgm
  on public.employees using gin (section gin_trgm_ops);
