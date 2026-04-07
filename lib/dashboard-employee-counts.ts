import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardEmployeeCounts = {
  total: number;
  active: number;
  deactive: number;
  error: string | null;
};

/** Counts respect RLS (same as directory). */
export async function fetchDashboardEmployeeCounts(
  supabase: SupabaseClient,
): Promise<DashboardEmployeeCounts> {
  const [totalRes, activeRes, deactiveRes] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active"),
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "Deactive"),
  ]);

  const err =
    totalRes.error?.message ??
    activeRes.error?.message ??
    deactiveRes.error?.message ??
    null;

  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    deactive: deactiveRes.count ?? 0,
    error: err,
  };
}
