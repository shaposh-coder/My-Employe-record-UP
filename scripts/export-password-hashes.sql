-- Run in OLD Supabase project → SQL Editor → Run
-- Then: Results → Download as JSON (or copy) into:
--   scripts/.migration-output/password-hashes.json
-- Format: [ { "email": "...", "encrypted_password": "..." }, ... ]

select
  lower(trim(email)) as email,
  encrypted_password
from auth.users
where email is not null
  and coalesce(encrypted_password, '') <> ''
order by email;
