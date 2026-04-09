import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";
import { normalizeTitleKey } from "@/lib/normalize-title-key";

export type DeptSectionBreakdownRow = {
  title: string;
  active: number;
  unActive: number;
};

export type DepartmentWithNestedSections = DeptSectionBreakdownRow & {
  sections: DeptSectionBreakdownRow[];
};

export type DashboardDeptSectionBreakdown = {
  rows: DepartmentWithNestedSections[];
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

function breakdownSectionForDepartment(
  departmentTitle: string,
  sectionTitles: { title: string }[],
  employees: EmpSlice[],
): DeptSectionBreakdownRow[] {
  const deptKey = normalizeTitleKey(departmentTitle);
  return sectionTitles.map(({ title }) => {
    const secKey = normalizeTitleKey(title);
    let active = 0;
    let unActive = 0;
    for (const e of employees) {
      if (normalizeTitleKey(e.department ?? "") !== deptKey) continue;
      if (normalizeTitleKey(e.section ?? "") !== secKey) continue;
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
    supabase
      .from("departments")
      .select("id, title")
      .order("title", { ascending: true }),
    supabase
      .from("sections")
      .select("department_id, title")
      .order("title", { ascending: true }),
    supabase.from("employees").select("department, section, status"),
  ]);

  const err =
    deptRes.error?.message ??
    secRes.error?.message ??
    empRes.error?.message ??
    null;

  if (err) {
    return { rows: [], error: err };
  }

  const departments = (deptRes.data ?? []) as { id: string; title: string }[];
  const sections = (secRes.data ?? []) as {
    department_id: string;
    title: string;
  }[];
  const employees = (empRes.data ?? []) as EmpSlice[];

  const rows: DepartmentWithNestedSections[] = departments.map((d) => {
    const base = breakdownForTitles([{ title: d.title }], employees, "department")[0];
    const secTitles = sections
      .filter((s) => s.department_id === d.id)
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((s) => ({ title: s.title }));
    return {
      ...base,
      sections: breakdownSectionForDepartment(d.title, secTitles, employees),
    };
  });

  return { rows, error: null };
}
