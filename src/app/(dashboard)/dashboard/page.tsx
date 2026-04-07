import { DashboardEmployeeStats } from "@/components/dashboard/dashboard-employee-stats";
import { fetchDashboardEmployeeCounts } from "@/lib/dashboard-employee-counts";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { total, active, deactive, error } =
    await fetchDashboardEmployeeCounts(supabase);

  return (
    <div className="space-y-4">
      {error ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          Could not load employee counts: {error}
        </p>
      ) : null}
      <DashboardEmployeeStats
        total={total}
        active={active}
        deactive={deactive}
      />
    </div>
  );
}
