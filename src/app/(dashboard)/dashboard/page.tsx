import { DashboardDeptSectionStats } from "@/components/dashboard/dashboard-dept-section-stats";
import { DashboardEmployeeStats } from "@/components/dashboard/dashboard-employee-stats";
import { fetchDashboardDeptSectionBreakdown } from "@/lib/dashboard-dept-section-counts";
import { fetchDashboardEmployeeCounts } from "@/lib/dashboard-employee-counts";
import { fetchAllowedDepartmentForSession } from "@/lib/fetch-allowed-department-for-session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const scope = await fetchAllowedDepartmentForSession(supabase);
  const [emp, deptSec] = await Promise.all([
    fetchDashboardEmployeeCounts(supabase, { department: scope }),
    fetchDashboardDeptSectionBreakdown(supabase, { department: scope }),
  ]);

  const loadError = [emp.error, deptSec.error].filter(Boolean).join(" — ");

  return (
    <div className="space-y-4">
      {loadError ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          Could not load some dashboard stats: {loadError}
        </p>
      ) : null}
      <DashboardEmployeeStats
        total={emp.total}
        active={emp.active}
        unActive={emp.unActive}
      />
      <DashboardDeptSectionStats rows={deptSec.rows} />
    </div>
  );
}
