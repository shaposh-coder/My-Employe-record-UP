import type { EmployeeListRow } from "@/components/employees/employee-list-row";

/** Map a Supabase `employees` row (snake_case) to the directory table shape. */
export function employeeListRowFromDbRow(
  row: Record<string, unknown>,
): EmployeeListRow {
  const sl = row.social_links;
  return {
    id: String(row.id),
    profile_image: (row.profile_image as string | null) ?? null,
    full_name: String(row.full_name ?? ""),
    father_name: (row.father_name as string | null) ?? null,
    dob: (row.dob as string | null) ?? null,
    cnic_no: String(row.cnic_no ?? ""),
    ss_eubi_no: (row.ss_eubi_no as string | null) ?? null,
    phone_no: (row.phone_no as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    department: String(row.department ?? ""),
    section: (row.section as string | null) ?? null,
    education: (row.education as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    experience: (row.experience as string | null) ?? null,
    social_media_link: (row.social_media_link as string | null) ?? null,
    social_links:
      sl && typeof sl === "object"
        ? (sl as Record<string, string | null>)
        : null,
    email_address: (row.email_address as string | null) ?? null,
    reference_info: (row.reference_info as string | null) ?? null,
    family_name: (row.family_name as string | null) ?? null,
    family_father_name: (row.family_father_name as string | null) ?? null,
    family_cnic: (row.family_cnic as string | null) ?? null,
    family_phone: (row.family_phone as string | null) ?? null,
    family_phone_alt: (row.family_phone_alt as string | null) ?? null,
    status: (row.status as string | null) ?? "Active",
  };
}
