import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  USER_ACCESS_ROLES,
  type UserAccessRole,
  normalizeUserAccessEmail,
} from "@/lib/user-access";

export const runtime = "nodejs";

const MIN_PASSWORD_LEN = 8;

function isRole(v: unknown): v is UserAccessRole {
  return (
    typeof v === "string" &&
    (USER_ACCESS_ROLES as readonly string[]).includes(v)
  );
}

/** Signed-in user with a row in `user_access` and role `admin` (manage users API). */
async function requireAdminActor(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const email = normalizeUserAccessEmail(user.email);
  const { data: row } = await supabase
    .from("user_access")
    .select("access_role")
    .eq("email", email)
    .maybeSingle();

  if (!row || !isRole(row.access_role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  if (row.access_role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Only admins can add or remove users" },
        { status: 403 },
      ),
    };
  }
  return { ok: true };
}

/**
 * Create Supabase Auth user + `user_access` row (requires service role).
 */
export async function POST(req: Request) {
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.response;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = normalizeUserAccessEmail(String(body.email ?? ""));
  const password = typeof body.password === "string" ? body.password : "";
  const full_name = String(body.full_name ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const access_role = body.access_role;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!full_name) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!isRole(access_role)) {
    return NextResponse.json({ error: "Invalid access level" }, { status: 400 });
  }

  const rawAllowedDept =
    body.allowed_department === null || body.allowed_department === undefined
      ? ""
      : String(body.allowed_department).trim();
  const allowed_department: string | null =
    access_role === "admin" ? null : rawAllowedDept || null;

  const timeline_access =
    access_role === "admin"
      ? true
      : Boolean(body.timeline_access);

  if (password.length < MIN_PASSWORD_LEN) {
    return NextResponse.json(
      {
        error: `Password must be at least ${MIN_PASSWORD_LEN} characters`,
      },
      { status: 400 },
    );
  }

  if (allowed_department) {
    const { data: deptRow, error: deptErr } = await admin
      .from("departments")
      .select("title")
      .eq("title", allowed_department)
      .maybeSingle();
    if (deptErr || !deptRow) {
      return NextResponse.json(
        { error: "Assigned department must match a department in Configuration" },
        { status: 400 },
      );
    }
  }

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authErr || !authData.user) {
    const msg = authErr?.message ?? "Could not create login";
    const lower = msg.toLowerCase();
    const status =
      lower.includes("already") || lower.includes("registered") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  const userId = authData.user.id;

  const { error: insertErr } = await admin.from("user_access").insert({
    email,
    full_name,
    access_role,
    allowed_department,
    timeline_access,
    notes,
    auth_user_id: userId,
  });

  if (insertErr) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

type DeleteBody = { id?: string };

/**
 * Remove `user_access` row and linked Auth user when `auth_user_id` is set.
 */
export async function DELETE(req: Request) {
  const auth = await requireAdminActor();
  if (!auth.ok) {
    return auth.response;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server configuration error";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  let body: DeleteBody;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: row, error: fetchErr } = await admin
    .from("user_access")
    .select("auth_user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 400 });
  }
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authUserId = row.auth_user_id as string | null;
  if (authUserId) {
    const { error: delAuthErr } = await admin.auth.admin.deleteUser(authUserId);
    if (delAuthErr) {
      return NextResponse.json(
        { error: delAuthErr.message },
        { status: 400 },
      );
    }
  }

  const { error: delErr } = await admin.from("user_access").delete().eq("id", id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
