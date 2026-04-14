import type { SupabaseClient } from "@supabase/supabase-js";

export type FormDepartmentOptionRow = { id: string; title: string };
export type FormSectionOptionRow = FormDepartmentOptionRow & {
  department_id: string;
};

/** Departments + sections for Add/Edit employee comboboxes (small bounded queries). */
export async function fetchDepartmentsSectionsForEmployeeForm(
  supabase: SupabaseClient,
  options?: { lockDepartmentTitle?: string | null },
): Promise<{
  departments: FormDepartmentOptionRow[];
  sections: FormSectionOptionRow[];
  error: string | null;
}> {
  const lock = options?.lockDepartmentTitle?.trim();
  const [dRes, sRes] = await Promise.all([
    supabase.from("departments").select("id, title").order("title"),
    supabase.from("sections").select("id, title, department_id").order("title"),
  ]);
  if (dRes.error || sRes.error) {
    return {
      departments: [],
      sections: [],
      error:
        dRes.error?.message ??
        sRes.error?.message ??
        "Could not load options",
    };
  }
  let departments = (dRes.data as FormDepartmentOptionRow[]) ?? [];
  let sections = (sRes.data as FormSectionOptionRow[]) ?? [];
  if (lock) {
    departments = departments.filter((d) => d.title === lock);
    const ids = new Set(departments.map((d) => d.id));
    sections = sections.filter((s) => ids.has(s.department_id));
  }
  return {
    departments,
    sections,
    error: null,
  };
}
