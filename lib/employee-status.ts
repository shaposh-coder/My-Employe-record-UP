/** Stored in `public.employees.status` — must match DB check constraint. */
export const EMPLOYEE_STATUS = {
  Active: "Active",
  UnActive: "Un-Active",
} as const;

export type EmployeeStoredStatus =
  (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

/**
 * Reads `?status=` on `/employees`. Accepts `active`, `un-active` (and legacy `deactive`).
 */
export function parseEmployeesStatusQueryParam(
  raw: string | null | undefined,
): "" | EmployeeStoredStatus {
  if (!raw?.trim()) return "";
  const s = raw.trim().toLowerCase();
  if (s === "active") return EMPLOYEE_STATUS.Active;
  if (s === "un-active" || s === "unactive" || s === "deactive") {
    return EMPLOYEE_STATUS.UnActive;
  }
  return "";
}
