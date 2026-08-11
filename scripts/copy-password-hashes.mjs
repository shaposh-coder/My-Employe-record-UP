/**
 * Copy password hashes from old Supabase auth.users → new project
 * so users keep their original passwords.
 *
 * Why service_role alone is not enough:
 *   Auth Admin API never returns encrypted_password.
 *   You need either Database password (direct Postgres) or a SQL export from the old project.
 *
 * Option A — Database password (recommended for one command):
 *   In .env.local add:
 *     old_supabase_db_password=...   # Old project Settings → Database
 *   Then:
 *     node --env-file=.env.local scripts/copy-password-hashes.mjs
 *
 * Option B — SQL export (no DB password):
 *   Old Supabase → SQL Editor → run scripts/export-password-hashes.sql
 *   Save result as scripts/.migration-output/password-hashes.json
 *   (array of { "email": "...", "encrypted_password": "..." })
 *   Then:
 *     node --env-file=.env.local scripts/copy-password-hashes.mjs --from-file
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, ".migration-output");

function env(...names) {
  for (const n of names) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  return "";
}

const oldUrl = env("old_supabase_url", "OLD_SUPABASE_URL");
const oldService = env(
  "old_supabase_service_role_key",
  "OLD_SUPABASE_SERVICE_ROLE_KEY",
);
const newUrl = env("NEXT_PUBLIC_SUPABASE_URL", "NEW_SUPABASE_URL");
const newService = env(
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEW_SUPABASE_SERVICE_ROLE_KEY",
);
const oldDbPass = env("old_supabase_db_password", "OLD_DB_PASSWORD");

const fromFile = process.argv.includes("--from-file");

function refFromUrl(u) {
  return new URL(u).hostname.split(".")[0];
}

async function fetchHashesViaPostgres(projectRef, password) {
  let pg;
  try {
    pg = (await import("pg")).default;
  } catch {
    throw new Error("Install pg: npm install pg");
  }

  const regions = [
    "ap-southeast-1",
    "ap-south-1",
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "us-east-1",
    "us-west-1",
  ];
  const candidates = [
    ...regions.map(
      (r) =>
        `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-${r}.pooler.supabase.com:6543/postgres`,
    ),
    `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  ];

  let lastErr = null;
  for (const cs of candidates) {
    const client = new pg.Client({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    try {
      await client.connect();
      const { rows } = await client.query(
        `select lower(trim(email)) as email, encrypted_password
         from auth.users
         where email is not null
           and coalesce(encrypted_password, '') <> ''`,
      );
      await client.end();
      return rows;
    } catch (e) {
      lastErr = e;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error(
    `Could not connect to old Postgres. Check old_supabase_db_password. (${lastErr?.message || lastErr})`,
  );
}

function loadHashesFromFile() {
  const path = join(outDir, "password-hashes.json");
  if (!existsSync(path)) {
    throw new Error(
      `Missing ${path}. Export hashes from old project SQL first.`,
    );
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const rows = Array.isArray(raw) ? raw : raw.rows || raw.data || [];
  return rows
    .map((r) => ({
      email: String(r.email || r.Email || "")
        .toLowerCase()
        .trim(),
      encrypted_password: String(
        r.encrypted_password || r.encryptedPassword || r.password_hash || "",
      ).trim(),
    }))
    .filter((r) => r.email && r.encrypted_password);
}

async function applyHash(newBaseUrl, serviceKey, userId, hash) {
  const res = await fetch(`${newBaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password_hash: hash }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
}

async function main() {
  if (!oldUrl || !oldService || !newUrl || !newService) {
    console.error("Need old + new Supabase URL and service role keys in .env.local");
    process.exit(1);
  }

  console.log("Old:", oldUrl);
  console.log("New:", newUrl);

  let hashes;
  if (fromFile) {
    hashes = loadHashesFromFile();
    console.log(`Loaded ${hashes.length} hashes from file`);
  } else if (oldDbPass) {
    console.log("Reading hashes via old project Postgres…");
    hashes = await fetchHashesViaPostgres(refFromUrl(oldUrl), oldDbPass);
    console.log(`Fetched ${hashes.length} hashes`);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "password-hashes.json"),
      JSON.stringify(hashes, null, 2),
    );
  } else {
    console.error(`
Service role keys alone CANNOT read password hashes (Auth API does not return them).

Add to .env.local (Old project → Settings → Database → Database password):
  old_supabase_db_password=YOUR_OLD_DB_PASSWORD

Then re-run:
  node --env-file=.env.local scripts/copy-password-hashes.mjs

OR without DB password:
  1) Old Supabase SQL Editor → run scripts/export-password-hashes.sql
  2) Save JSON array as scripts/.migration-output/password-hashes.json
  3) node --env-file=.env.local scripts/copy-password-hashes.mjs --from-file
`);
    process.exit(2);
  }

  const newAdmin = createClient(newUrl, newService, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userList, error } = await newAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) throw error;

  const byEmail = new Map(
    userList.users.map((u) => [u.email?.toLowerCase().trim(), u]),
  );

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const row of hashes) {
    const user = byEmail.get(row.email);
    if (!user) {
      console.log(`skip (not on new): ${row.email}`);
      skip++;
      continue;
    }
    try {
      await applyHash(newUrl, newService, user.id, row.encrypted_password);
      console.log(`updated: ${row.email}`);
      ok++;
    } catch (e) {
      console.error(`fail: ${row.email}:`, e.message);
      fail++;
    }
  }

  console.log(`\nDone. updated=${ok} skip=${skip} fail=${fail}`);
  console.log(
    "Users who existed on old now use their ORIGINAL passwords again.",
  );
  console.log(
    "(e.g. admin@trendswd.com was not on old — keep their current temporary password)",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
