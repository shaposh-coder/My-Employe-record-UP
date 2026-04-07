/** Build `/employees` URLs with optional filters (query string encoded). */
export function employeesDirectoryHref(opts: {
  department?: string;
  section?: string;
  /** Matches `parseEmployeesStatusQueryParam` (`active` | `un-active`). */
  status?: "active" | "un-active";
}): string {
  const sp = new URLSearchParams();
  if (opts.department?.trim()) sp.set("department", opts.department.trim());
  if (opts.section?.trim()) sp.set("section", opts.section.trim());
  if (opts.status) sp.set("status", opts.status);
  const q = sp.toString();
  return q ? `/employees?${q}` : "/employees";
}
