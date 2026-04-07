-- Link directory rows to Supabase Auth users (created via Admin API when adding password).

alter table public.user_access
  add column if not exists auth_user_id uuid;

comment on column public.user_access.auth_user_id is 'auth.users.id when this row was created with login; null for legacy rows.';

create unique index if not exists user_access_auth_user_id_unique
  on public.user_access (auth_user_id)
  where auth_user_id is not null;

-- Optional FK — skip if auth schema not visible in migration runner; index is enough for app logic.
