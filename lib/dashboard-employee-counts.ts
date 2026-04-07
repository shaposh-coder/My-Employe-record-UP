import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";

export type DashboardEmployeeCounts = {
  total: number;
  active: number;
  unActive: number;
  error: string | null;
};

/** Counts respect RLS (same as directory). */
export async function fetchDashboardEmployeeCounts(
  supabase: SupabaseClient,
): Promise<DashboardEmployeeCounts> {
  const [totalRes, activeRes, unActiveRes] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", EMPLOYEE_STATUS.Active),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", EMPLOYEE_STATUS.UnActive),
  ]);

  const err =
    totalRes.error?.message ??
    activeRes.error?.message ??
    unActiveRes.error?.message ??
    null;

  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    unActive: unActiveRes.count ?? 0,
    error: err,
  };
}
