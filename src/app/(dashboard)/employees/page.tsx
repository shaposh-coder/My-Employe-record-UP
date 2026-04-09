import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EmployeesDirectoryClient } from "@/components/employees/employees-directory-client";
import { EmployeesTableSkeleton } from "@/components/employees/employees-table-skeleton";
import {
  DEFAULT_EMPLOYEES_PAGE_SIZE,
  fetchEmployees,
} from "@/lib/fetch-employees";
import { fetchEmployeeFilterOptions } from "@/lib/fetch-employee-filter-options";
import { parseEmployeesStatusQueryParam } from "@/lib/employee-status";
import { defaultColumnVisibility } from "@/lib/employee-table-columns";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmployeesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const department =
    typeof sp.department === "string" ? sp.department : "";
  const section = typeof sp.section === "string" ? sp.section : "";
  const city = typeof sp.city === "string" ? sp.city : "";
  const statusParam =
    typeof sp.status === "string" ? sp.status : null;
  const status = parseEmployeesStatusQueryParam(statusParam);

  const supabase = await createClient();
  const [listRes, filterOpts] = await Promise.all([
    fetchEmployees(supabase, {
      page: 1,
      pageSize: DEFAULT_EMPLOYEES_PAGE_SIZE,
      department: department.trim() || undefined,
      section: section.trim() || undefined,
      city: city.trim() || undefined,
      status: status || undefined,
    }),
    fetchEmployeeFilterOptions(supabase),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
            <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-t-2xl">
              <EmployeesTableSkeleton
                visibility={defaultColumnVisibility()}
                rowCount={DEFAULT_EMPLOYEES_PAGE_SIZE}
                embedInCard
              />
            </div>
          </div>
        </div>
      }
    >
      <EmployeesDirectoryClient
        initialRows={listRes.rows}
        initialTotal={listRes.total}
        initialLoadError={listRes.error}
        initialDepartmentOptions={filterOpts.departments}
        initialSectionOptions={filterOpts.sections}
        initialCityOptions={filterOpts.cities}
      />
    </Suspense>
  );
}
