import type { SupabaseClient } from "@supabase/supabase-js";
import { formatTitleForStorage } from "@/lib/configuration/format-directory-title";

export type ConfigurationDirectoryItem = {
  id: string;
  title: string;
  description: string;
};

export type ConfigurationSectionItem = ConfigurationDirectoryItem & {
  department_id: string;
};

type DeptCountRow = { dept_id: string; employee_count: number | string };
type SecCountRow = { section_id: string; employee_count: number | string };

function mapCount<T extends Record<string, unknown>>(
  rows: T[] | null,
  idKey: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows ?? []) {
    const id = r[idKey];
    const c = r.employee_count;
    if (typeof id === "string") {
      const n = typeof c === "number" ? c : Number(c);
      out[id] = Number.isFinite(n) ? n : 0;
    }
  }
  return out;
}

function buildFallbackCounts(
  deptRows: ConfigurationDirectoryItem[],
  secRows: ConfigurationSectionItem[],
  emps: { department: string | null; section: string | null }[],
): { dept: Record<string, number>; sec: Record<string, number> } {
  const deptOut: Record<string, number> = {};
  const secOut: Record<string, number> = {};
  for (const row of deptRows) {
    const key = formatTitleForStorage(row.title);
    deptOut[row.id] = emps.filter(
      (e) =>
        e.department != null &&
        formatTitleForStorage(e.department) === key,
    ).length;
  }
  for (const row of secRows) {
    const key = formatTitleForStorage(row.title);
    secOut[row.id] = emps.filter(
      (e) =>
        e.section != null && formatTitleForStorage(e.section) === key,
    ).length;
  }
  return { dept: deptOut, sec: secOut };
}

function sortByTitle<T extends { title: string }>(a: T, b: T) {
  return a.title.localeCompare(b.title);
}

/**
 * Departments, sections, and per-row employee counts for Configuration UI.
 * Uses RPC counts when available; otherwise a bounded fallback on `employees`.
 */
export async function fetchConfigurationDirectorySnapshot(
  supabase: SupabaseClient,
): Promise<{
  departments: ConfigurationDirectoryItem[];
  sections: ConfigurationSectionItem[];
  deptCounts: Record<string, number>;
  secCounts: Record<string, number>;
  error: string | null;
}> {
  const [dRes, sRes] = await Promise.all([
    supabase.from("departments").select("*").order("title"),
    supabase.from("sections").select("*").order("title"),
  ]);

  if (dRes.error) {
    return {
      departments: [],
      sections: [],
      deptCounts: {},
      secCounts: {},
      error: dRes.error.message,
    };
  }
  if (sRes.error) {
    return {
      departments: [],
      sections: [],
      deptCounts: {},
      secCounts: {},
      error: sRes.error.message,
    };
  }

  const deptRows = ((dRes.data as ConfigurationDirectoryItem[]) ?? [])
    .map((r) => ({
      ...r,
      description: r.description ?? "",
    }))
    .slice()
    .sort(sortByTitle);
  const secRows = ((sRes.data as ConfigurationSectionItem[]) ?? [])
    .map((r) => ({
      ...r,
      description: r.description ?? "",
    }))
    .slice()
    .sort(sortByTitle);

  const [dcRes, scRes] = await Promise.all([
    supabase.rpc("department_employee_counts"),
    supabase.rpc("section_employee_counts"),
  ]);

  if (!dcRes.error && dcRes.data != null && !scRes.error && scRes.data != null) {
    return {
      departments: deptRows,
      sections: secRows,
      deptCounts: mapCount(dcRes.data as DeptCountRow[], "dept_id"),
      secCounts: mapCount(scRes.data as SecCountRow[], "section_id"),
      error: null,
    };
  }

  const { data: emps, error: empErr } = await supabase
    .from("employees")
    .select("department, section");
  if (empErr) {
    return {
      departments: deptRows,
      sections: secRows,
      deptCounts: {},
      secCounts: {},
      error: null,
    };
  }
  const list = (emps ?? []) as {
    department: string | null;
    section: string | null;
  }[];
  const { dept, sec } = buildFallbackCounts(deptRows, secRows, list);
  return {
    departments: deptRows,
    sections: secRows,
    deptCounts: dept,
    secCounts: sec,
    error: null,
  };
}
