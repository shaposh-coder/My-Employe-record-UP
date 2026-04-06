import type { EmployeeListRow } from "@/components/employees/employees-table";
import { createClient } from "@/lib/supabase/client";
import { employeeListRowFromDbRow } from "@/lib/employee-list-row-from-db";

const SELECT_COLUMNS =
  "id, profile_image, full_name, father_name, dob, cnic_no, ss_eubi_no, phone_no, city, department, section, education, address, experience, social_media_link, social_links, email_address, reference_info, family_name, family_father_name, family_cnic, family_phone, family_phone_alt, status";

/** Load employees for the directory table (newest first). */
export async function fetchEmployeesForTable(): Promise<{
  rows: EmployeeListRow[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) return { rows: [], error: error.message };
    if (!data?.length) return { rows: [], error: null };
    return {
      rows: data.map((r) =>
        employeeListRowFromDbRow(r as Record<string, unknown>),
      ),
      error: null,
    };
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : "Could not load employees",
    };
  }
}
