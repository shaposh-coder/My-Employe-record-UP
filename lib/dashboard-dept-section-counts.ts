import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";
import { normalizeTitleKey } from "@/lib/normalize-title-key";

export type DeptSectionBreakdownRow = {
  title: string;
  active: number;
  unActive: number;
};

export type DashboardDeptSectionBreakdown = {
  departmentRows: DeptSectionBreakdownRow[];
  sectionRows: DeptSectionBreakdownRow[];
  error: string | null;
};

type EmpSlice = {
  department: string | null;
  section: string | null;
  status: string | null;
};

function breakdownForTitles(
  titles: { title: string }[],
  employees: EmpSlice[],
  field: "department" | "section",
): DeptSectionBreakdownRow[] {
  return titles.map(({ title }) => {
    const key = normalizeTitleKey(title);
    let active = 0;
    let unActive = 0;
    for (const e of employees) {
      const raw = field === "department" ? e.department : e.section;
      if (normalizeTitleKey(raw ?? "") !== key) continue;
      if (e.status === EMPLOYEE_STATUS.Active) active += 1;
      else if (e.status === EMPLOYEE_STATUS.UnActive) unActive += 1;
    }
    return { title, active, unActive };
  });
}

export async function fetchDashboardDeptSectionBreakdown(
  supabase: SupabaseClient,
): Promise<DashboardDeptSectionBreakdown> {
  const [deptRes, secRes, empRes] = await Promise.all([
    supabase.from("departments").select("title").order("title", { ascending: true }),
    supabase.from("sections").select("title").order("title", { ascending: true }),
    supabase.from("employees").select("department, section, status"),
  ]);

  const err =
    deptRes.error?.message ??
    secRes.error?.message ??
    empRes.error?.message ??
    null;

  if (err) {
    return { departmentRows: [], sectionRows: [], error: err };
  }

  const departments = (deptRes.data ?? []) as { title: string }[];
  const sections = (secRes.data ?? []) as { title: string }[];
  const employees = (empRes.data ?? []) as EmpSlice[];

  return {
    departmentRows: breakdownForTitles(departments, employees, "department"),
    sectionRows: breakdownForTitles(sections, employees, "section"),
    error: null,
  };
}
