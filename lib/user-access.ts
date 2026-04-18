import type { SupabaseClient } from "@supabase/supabase-js";

export const USER_ACCESS_ROLES = ["admin", "manager", "viewer"] as const;

export type UserAccessRole = (typeof USER_ACCESS_ROLES)[number];

export type UserAccessRow = {
  id: string;
  email: string;
  full_name: string;
  access_role: UserAccessRole;
  /** When set, user is scoped to this department title (directory + dashboard). */
  allowed_department: string | null;
  /**
   * Managers/viewers: when true, may view timelines; managers may add entries.
   * Ignored for admin in UI (admins always have full timeline access).
   */
  timeline_access: boolean;
  notes: string;
  /** Public URL for optional profile photo. */
  avatar_url?: string;
  /** Set when user was created with Auth (password); used for admin delete. */
  auth_user_id?: string | null;
  created_at: string;
  updated_at: string;
};

export const USER_ACCESS_ROLE_LABELS: Record<UserAccessRole, string> = {
  admin: "Admin",
  manager: "Manager",
  viewer: "Viewer",
};

export const USER_ACCESS_ROLE_DESCRIPTIONS: Record<UserAccessRole, string> = {
  admin: "Full access — users, configuration, employees",
  manager: "Create/edit employees, departments & sections (no user management)",
  viewer: "View directory only — cannot add, edit, or delete",
};

export function normalizeUserAccessEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function fetchUserAccessRows(
  supabase: SupabaseClient,
): Promise<{ rows: UserAccessRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("user_access")
    .select(
      "id, email, full_name, access_role, allowed_department, timeline_access, notes, avatar_url, auth_user_id, created_at, updated_at",
    )
    .order("created_at", { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }
  const rows = (data ?? []).map((r) => ({
    ...(r as UserAccessRow),
    timeline_access: Boolean((r as UserAccessRow).timeline_access),
  }));
  return { rows, error: null };
}
