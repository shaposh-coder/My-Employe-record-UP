import type { EmployeeListRow } from "@/components/employees/employee-list-row";
import { createClient } from "@/lib/supabase/client";
import { employeeListRowFromDbRow } from "@/lib/employee-list-row-from-db";

const SELECT_COLUMNS =
  "id, profile_image, full_name, father_name, dob, cnic_no, ss_eubi_no, phone_no, city, department, section, education, address, experience, social_media_link, social_links, email_address, reference_info, family_name, family_father_name, family_cnic, family_phone, family_phone_alt, status";

/** Allowed “per page” values for the employee directory. */
export const EMPLOYEES_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export type EmployeesPageSize = (typeof EMPLOYEES_PAGE_SIZE_OPTIONS)[number];

/** Default when no `pageSize` is passed to the fetch helper. */
export const DEFAULT_EMPLOYEES_PAGE_SIZE: EmployeesPageSize = 50;

export type FetchEmployeesOptions = {
  page?: number;
  pageSize?: number;
};

/** Load employees for the directory table (newest first), with optional pagination. */
export async function fetchEmployeesForTable(
  options?: FetchEmployeesOptions,
): Promise<{
  rows: EmployeeListRow[];
  total: number;
  error: string | null;
}> {
  const pageSize = options?.pageSize ?? DEFAULT_EMPLOYEES_PAGE_SIZE;
  const page = Math.max(1, options?.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = createClient();
    const { data, error, count } = await supabase
      .from("employees")
      .select(SELECT_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return { rows: [], total: 0, error: error.message };
    const total = count ?? 0;
    if (!data?.length) return { rows: [], total, error: null };
    return {
      rows: data.map((r) =>
        employeeListRowFromDbRow(r as Record<string, unknown>),
      ),
      total,
      error: null,
    };
  } catch (e) {
    return {
      rows: [],
      total: 0,
      error: e instanceof Error ? e.message : "Could not load employees",
    };
  }
}
