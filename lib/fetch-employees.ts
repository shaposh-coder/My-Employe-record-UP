import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmployeeListRow } from "@/components/employees/employee-list-row";
import { employeeListRowFromDbRow } from "@/lib/employee-list-row-from-db";
import {
  EMPLOYEE_STATUS,
  type EmployeeStoredStatus,
  parseEmployeesStatusQueryParam,
} from "@/lib/employee-status";

export type { EmployeeStoredStatus };
export { parseEmployeesStatusQueryParam };

const SELECT_COLUMNS =
  "id, profile_image, full_name, father_name, dob, cnic_no, ss_eubi_no, phone_no, city, department, section, education, address, experience, social_media_link, social_links, email_address, reference_info, family_name, family_father_name, family_cnic, family_phone, family_phone_alt, status";

/** Allowed “per page” values for the employee directory. */
export const EMPLOYEES_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export type EmployeesPageSize = (typeof EMPLOYEES_PAGE_SIZE_OPTIONS)[number];

/** Default when no `pageSize` is passed to the fetch helper. */
export const DEFAULT_EMPLOYEES_PAGE_SIZE: EmployeesPageSize = 50;

export type FetchEmployeesOptions = {
  /** 1-based page index. */
  page?: number;
  pageSize?: number;
  /** Trims; server-side `ilike` on name, phone, CNIC, city, department, section. */
  search?: string;
  department?: string;
  section?: string;
  city?: string;
  /** When set, only rows with this `employees.status` (Active / Un-Active). */
  status?: EmployeeStoredStatus;
};

/** Strip characters that break PostgREST `or()` filter strings. */
function sanitizeSearchToken(raw: string): string {
  return raw
    .replace(/,/g, " ")
    .replace(/%/g, "")
    .replace(/_/g, "")
    .trim()
    .slice(0, 200);
}

/**
 * Builds PostgREST `or=(...)` clause for cross-column ILIKE search (server-side only).
 * Uses the same pattern for each column so `%` wildcards stay in the value.
 */
function buildSearchOrFilter(token: string): string | null {
  if (!token) return null;
  const pattern = `%${token}%`;
  const cols = [
    "full_name",
    "phone_no",
    "cnic_no",
    "city",
    "department",
    "section",
  ] as const;
  return cols.map((col) => `${col}.ilike.${pattern}`).join(",");
}

/**
 * Loads one page of employees for the directory table (newest first), with server-side
 * filters, search (`ilike`), and Supabase `.range(from, to)` — never fetches the full table.
 * Pass a server or browser `SupabaseClient` (RLS applies in both cases).
 */
export async function fetchEmployees(
  supabase: SupabaseClient,
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
    let query = supabase
      .from("employees")
      .select(SELECT_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false });

    const searchRaw = options?.search?.trim();
    if (searchRaw) {
      const token = sanitizeSearchToken(searchRaw);
      if (token.length > 0) {
        const orClause = buildSearchOrFilter(token);
        if (orClause) {
          query = query.or(orClause);
        }
      }
    }

    const dept = options?.department?.trim();
    if (dept) query = query.eq("department", dept);

    const sec = options?.section?.trim();
    if (sec) query = query.eq("section", sec);

    const city = options?.city?.trim();
    if (city) query = query.eq("city", city);

    const st = options?.status;
    if (st === EMPLOYEE_STATUS.Active || st === EMPLOYEE_STATUS.UnActive) {
      query = query.eq("status", st);
    }

    const { data, error, count } = await query.range(from, to);
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

/**
 * Loads every row matching the same filters as the directory (paginated internally).
 * Used for CSV export — respects current search / department / section / city / status.
 */
export async function fetchAllEmployeesForExport(
  supabase: SupabaseClient,
  options: Omit<FetchEmployeesOptions, "page" | "pageSize">,
): Promise<{ rows: EmployeeListRow[]; error: string | null }> {
  const chunkSize = 500;
  const all: EmployeeListRow[] = [];
  let page = 1;
  for (;;) {
    const { rows, error } = await fetchEmployees(supabase, {
      ...options,
      page,
      pageSize: chunkSize,
    });
    if (error) return { rows: [], error };
    all.push(...rows);
    if (rows.length < chunkSize) break;
    page += 1;
  }
  return { rows: all, error: null };
}

/** @deprecated Use `fetchEmployees` — alias kept for existing imports. */
export const fetchEmployeesForTable = fetchEmployees;
