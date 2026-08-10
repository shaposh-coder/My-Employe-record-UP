/**
 * Migrate data from old Supabase → new Supabase, and files → Cloudflare R2.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-to-new-supabase-r2.mjs
 *
 * Required env (see .env.local):
 *   OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY
 *   NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY
 *   (or NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY for NEW if NEW_* unset)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_BASE_URL, R2_FOLDER_PREFIX
 */

import { createClient } from "@supabase/supabase-js";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONCURRENCY = 8;
const PAGE = 1000;
const TEMP_PASSWORD_DEFAULT = "ShaposhMigrate2026!";
const URL_COLS = [
  "profile_image",
  "cnic_front",
  "cnic_back",
  "father_image",
  "father_cnic_front",
  "father_cnic_back",
];

function env(name, fallbackName) {
  const v = process.env[name]?.trim();
  if (v) return v;
  if (fallbackName) {
    const f = process.env[fallbackName]?.trim();
    if (f) return f;
  }
  return "";
}

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return value;
}

const OLD_URL = requireEnv(
  "OLD_SUPABASE_URL",
  env("OLD_SUPABASE_URL"),
);
const OLD_KEY = requireEnv(
  "OLD_SUPABASE_SERVICE_ROLE_KEY",
  env("OLD_SUPABASE_SERVICE_ROLE_KEY"),
);
const NEW_URL = requireEnv(
  "NEW_SUPABASE_URL",
  env("NEW_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
);
const NEW_KEY = requireEnv(
  "NEW_SUPABASE_SERVICE_ROLE_KEY",
  env("NEW_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
);

const R2_ACCOUNT_ID = requireEnv("R2_ACCOUNT_ID", env("R2_ACCOUNT_ID"));
const R2_ACCESS_KEY_ID = requireEnv("R2_ACCESS_KEY_ID", env("R2_ACCESS_KEY_ID"));
const R2_SECRET_ACCESS_KEY = requireEnv(
  "R2_SECRET_ACCESS_KEY",
  env("R2_SECRET_ACCESS_KEY"),
);
const R2_BUCKET_NAME = requireEnv("R2_BUCKET_NAME", env("R2_BUCKET_NAME"));
const R2_PUBLIC_BASE_URL = requireEnv(
  "R2_PUBLIC_BASE_URL",
  env("R2_PUBLIC_BASE_URL"),
).replace(/\/+$/, "");
const R2_FOLDER_PREFIX = (env("R2_FOLDER_PREFIX") || "employee-attachments")
  .replace(/^\/+|\/+$/g, "");

const oldSb = createClient(OLD_URL, OLD_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const newSb = createClient(NEW_URL, NEW_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const OLD_PUBLIC_PREFIX = `${OLD_URL.replace(/\/+$/, "")}/storage/v1/object/public/employee-docs/`;

function extractStoragePath(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const idx = trimmed.indexOf("/storage/v1/object/public/employee-docs/");
  if (idx < 0) return null;
  const rest = trimmed.slice(
    idx + "/storage/v1/object/public/employee-docs/".length,
  );
  const path = decodeURIComponent(rest.split("?")[0] || "").replace(/^\/+/, "");
  if (!path || path.endsWith("/")) return null;
  return path;
}

function r2PublicUrl(objectPath) {
  const key = R2_FOLDER_PREFIX
    ? `${R2_FOLDER_PREFIX}/${objectPath}`
    : objectPath;
  return `${R2_PUBLIC_BASE_URL}/${key}`;
}

function rewriteUrl(url, pathToUrl) {
  const path = extractStoragePath(url);
  if (!path) return typeof url === "string" ? url : url;
  return pathToUrl.get(path) || r2PublicUrl(path);
}

async function fetchAll(client, table, select = "*") {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function mapPool(items, limit, fn) {
  let i = 0;
  let active = 0;
  let rejected = null;
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    const next = () => {
      if (rejected) return;
      if (i >= items.length && active === 0) return resolve(results);
      while (active < limit && i < items.length) {
        const idx = i++;
        active++;
        Promise.resolve(fn(items[idx], idx))
          .then((v) => {
            results[idx] = v;
            active--;
            next();
          })
          .catch((e) => {
            rejected = e;
            reject(e);
          });
      }
    };
    next();
  });
}

async function downloadOldObject(path) {
  const url = OLD_PUBLIC_PREFIX + path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(url);
  if (!res.ok) {
    // fallback: try unencoded (some keys already safe)
    const res2 = await fetch(OLD_PUBLIC_PREFIX + path);
    if (!res2.ok) {
      throw new Error(`download ${path}: HTTP ${res.status}/${res2.status}`);
    }
    const buf = Buffer.from(await res2.arrayBuffer());
    return { buf, contentType: res2.headers.get("content-type") || "application/octet-stream" };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    buf,
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}

async function uploadToR2(path, buf, contentType) {
  const key = R2_FOLDER_PREFIX ? `${R2_FOLDER_PREFIX}/${path}` : path;
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buf,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return r2PublicUrl(path);
}

async function migrateFiles(paths) {
  const pathToUrl = new Map();
  let done = 0;
  let failed = 0;
  const failures = [];

  await mapPool(paths, CONCURRENCY, async (path) => {
    try {
      const { buf, contentType } = await downloadOldObject(path);
      if (!buf.length) throw new Error("empty body");
      const url = await uploadToR2(path, buf, contentType);
      pathToUrl.set(path, url);
    } catch (e) {
      failed++;
      failures.push({ path, error: e instanceof Error ? e.message : String(e) });
      // still map to intended R2 URL so DB is consistent if file is later fixed
      pathToUrl.set(path, r2PublicUrl(path));
    } finally {
      done++;
      if (done % 50 === 0 || done === paths.length) {
        console.log(
          `  files ${done}/${paths.length} (failed ${failed})`,
        );
      }
    }
  });

  return { pathToUrl, failures };
}

async function migrateAuthUsers(oldUsers) {
  const { data: existingNew, error: listErr } = await newSb.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) throw listErr;
  const byEmail = new Map(
    (existingNew.users || []).map((u) => [u.email?.toLowerCase(), u]),
  );

  const idMap = new Map(); // oldAuthId -> newAuthId
  const passwordNotes = [];

  for (const u of oldUsers) {
    const email = (u.email || "").toLowerCase().trim();
    if (!email) continue;

    const existing = byEmail.get(email);
    if (existing) {
      idMap.set(u.id, existing.id);
      passwordNotes.push({
        email,
        status: "already_existed",
        note: "Password unchanged on new project",
      });
      continue;
    }

    const password =
      email === "admin@admin.com" ? "admin123" : TEMP_PASSWORD_DEFAULT;
    const { data, error } = await newSb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: u.user_metadata || {},
    });
    if (error) {
      console.error(`  auth create failed ${email}:`, error.message);
      passwordNotes.push({ email, status: "failed", note: error.message });
      continue;
    }
    idMap.set(u.id, data.user.id);
    byEmail.set(email, data.user);
    passwordNotes.push({
      email,
      status: "created",
      temporaryPassword: password,
    });
    console.log(`  created auth user ${email}`);
  }

  return { idMap, passwordNotes };
}

async function replaceTable(table, rows) {
  // wipe then insert (service role bypasses RLS)
  const { error: delErr } = await newSb.from(table).delete().neq(
    "id",
    "00000000-0000-0000-0000-000000000000",
  );
  if (delErr) {
    // some tables may be empty / policy — try truncate via delete all with filter true
    console.warn(`  delete ${table}:`, delErr.message);
  }

  if (!rows.length) {
    console.log(`  ${table}: 0 rows`);
    return;
  }

  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await newSb.from(table).upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`upsert ${table}: ${error.message}`);
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function main() {
  console.log("Old:", OLD_URL);
  console.log("New:", NEW_URL);
  console.log("R2 bucket:", R2_BUCKET_NAME, "prefix:", R2_FOLDER_PREFIX);

  console.log("\n1) Loading old data…");
  const [
    departments,
    sections,
    employees,
    timeline,
    userAccess,
    oldAuth,
  ] = await Promise.all([
    fetchAll(oldSb, "departments"),
    fetchAll(oldSb, "sections"),
    fetchAll(oldSb, "employees"),
    fetchAll(oldSb, "employee_timeline_entries"),
    fetchAll(oldSb, "user_access"),
    oldSb.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (oldAuth.error) throw oldAuth.error;
  const oldUsers = oldAuth.data.users || [];
  console.log({
    departments: departments.length,
    sections: sections.length,
    employees: employees.length,
    timeline: timeline.length,
    userAccess: userAccess.length,
    authUsers: oldUsers.length,
  });

  console.log("\n2) Collecting storage paths…");
  const pathSet = new Set();
  for (const e of employees) {
    for (const c of URL_COLS) {
      const p = extractStoragePath(e[c]);
      if (p) pathSet.add(p);
    }
    if (Array.isArray(e.other_documents)) {
      for (const d of e.other_documents) {
        const p = extractStoragePath(d?.url);
        if (p) pathSet.add(p);
      }
    }
  }
  for (const u of userAccess) {
    const p = extractStoragePath(u.avatar_url);
    if (p) pathSet.add(p);
  }
  const paths = [...pathSet];
  console.log("unique files:", paths.length);

  console.log("\n3) Migrating files to R2…");
  const { pathToUrl, failures } = await migrateFiles(paths);
  console.log(`files ok: ${paths.length - failures.length}, failed: ${failures.length}`);

  console.log("\n4) Migrating auth users…");
  const { idMap, passwordNotes } = await migrateAuthUsers(oldUsers);
  console.log("auth id mappings:", idMap.size);

  console.log("\n5) Rewriting URLs in rows…");
  const employeesNew = employees.map((e) => {
    const row = { ...e };
    for (const c of URL_COLS) {
      if (row[c]) row[c] = rewriteUrl(row[c], pathToUrl);
    }
    if (Array.isArray(row.other_documents)) {
      row.other_documents = row.other_documents.map((d) =>
        d && typeof d === "object"
          ? { ...d, url: rewriteUrl(d.url, pathToUrl) }
          : d,
      );
    }
    // profile_image is NOT NULL
    if (!row.profile_image) row.profile_image = "";
    return row;
  });

  const userAccessNew = userAccess.map((u) => {
    const row = { ...u };
    if (row.avatar_url) row.avatar_url = rewriteUrl(row.avatar_url, pathToUrl);
    if (row.auth_user_id && idMap.has(row.auth_user_id)) {
      row.auth_user_id = idMap.get(row.auth_user_id);
    }
    return row;
  });

  console.log("\n6) Writing tables to new Supabase…");
  // FK order: clear children first
  await replaceTable("employee_timeline_entries", []);
  await replaceTable("employees", []);
  await replaceTable("sections", []);
  await replaceTable("departments", []);
  // keep wiping user_access then insert migrated (includes admins)
  await replaceTable("user_access", []);

  await replaceTable("departments", departments);
  await replaceTable("sections", sections);
  await replaceTable("employees", employeesNew);
  await replaceTable("employee_timeline_entries", timeline);
  await replaceTable("user_access", userAccessNew);

  const outDir = join(__dirname, ".migration-output");
  mkdirSync(outDir, { recursive: true });
  const report = {
    migratedAt: new Date().toISOString(),
    oldUrl: OLD_URL,
    newUrl: NEW_URL,
    r2PublicBaseUrl: R2_PUBLIC_BASE_URL,
    counts: {
      departments: departments.length,
      sections: sections.length,
      employees: employees.length,
      timeline: timeline.length,
      userAccess: userAccess.length,
      files: paths.length,
      fileFailures: failures.length,
    },
    passwordNotes,
    fileFailures: failures.slice(0, 100),
  };
  writeFileSync(
    join(outDir, "report.json"),
    JSON.stringify(report, null, 2),
  );
  writeFileSync(
    join(outDir, "passwords.txt"),
    passwordNotes
      .map((p) =>
        p.temporaryPassword
          ? `${p.email}\t${p.temporaryPassword}\t${p.status}`
          : `${p.email}\t\t${p.status} — ${p.note || ""}`,
      )
      .join("\n") + "\n",
  );

  console.log("\nDone.");
  console.log(`Report: ${join(outDir, "report.json")}`);
  console.log(`Passwords: ${join(outDir, "passwords.txt")}`);
  if (failures.length) {
    console.log(
      `WARNING: ${failures.length} files failed — see report.json fileFailures`,
    );
  }
  console.log(
    `\nNext: point NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY to the NEW project, restart dev server.`,
  );
  console.log(
    `Migrated users (except those already on new) temporary password: ${TEMP_PASSWORD_DEFAULT}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
