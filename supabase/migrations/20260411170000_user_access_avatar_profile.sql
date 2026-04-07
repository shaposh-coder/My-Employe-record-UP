-- Optional profile image URL + RPC for users to update their own name/avatar (not role).

alter table public.user_access
  add column if not exists avatar_url text not null default '';

comment on column public.user_access.avatar_url is 'Public URL for optional profile photo (e.g. employee-docs bucket).';

create or replace function public.update_my_profile(
  p_full_name text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_access
  set
    full_name = case
      when trim(coalesce(p_full_name, '')) = '' then full_name
      else trim(p_full_name)
    end,
    avatar_url = trim(coalesce(p_avatar_url, '')),
    updated_at = now()
  where lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email', '')));
end;
$$;

revoke all on function public.update_my_profile(text, text) from public;
grant execute on function public.update_my_profile(text, text) to authenticated;

-- Own-folder uploads under employee-docs/user-avatars/{auth.uid()}/ for any app role (incl. viewer).
create policy "employee-docs_user_avatar_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  );

create policy "employee-docs_user_avatar_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  );

create policy "employee-docs_user_avatar_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'employee-docs'
    and public.app_user_role() is not null
    and split_part(name, '/', 1) = 'user-avatars'
    and split_part(name, '/', 2) = (select auth.uid()::text)
  );
