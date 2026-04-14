import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserAccessRole } from "@/lib/user-access";
import { normalizeUserAccessEmail } from "@/lib/user-access";

/**
 * Reads `user_access.allowed_department` for the signed-in user.
 * Admins are never scoped — always returns null regardless of column value.
 * Used server-side to scope employee queries and dashboard stats.
 */
export async function fetchAllowedDepartmentForSession(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const email = normalizeUserAccessEmail(user.email);
  const { data } = await supabase
    .from("user_access")
    .select("allowed_department, access_role")
    .eq("email", email)
    .maybeSingle();
  const role = data?.access_role as UserAccessRole | undefined;
  if (role === "admin") return null;
  const v = data?.allowed_department;
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
