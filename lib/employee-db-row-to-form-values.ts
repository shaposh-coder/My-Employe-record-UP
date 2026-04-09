import type { AddEmployeeFormValues } from "@/lib/validations/add-employee-form";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";
import {
  normalizeCnicFromDb,
  normalizePhoneFromDb,
} from "@/lib/format-cnic-phone";

function extractAdditionalDocUrl(other: unknown): string {
  if (!Array.isArray(other) || other.length === 0) return "";
  const first = other[0] as { url?: string };
  return typeof first?.url === "string" ? first.url : "";
}

/**
 * Maps a Supabase `employees` row to Add Employee form values (shared by server prefetch + client fallback).
 */
export function employeeDbRowToFormValues(
  d: Record<string, unknown>,
): AddEmployeeFormValues {
  const sl = (d.social_links as Record<string, string | null> | null) ?? {};
  return {
    full_name: String(d.full_name ?? ""),
    status:
      d.status === EMPLOYEE_STATUS.UnActive || d.status === "Deactive"
        ? EMPLOYEE_STATUS.UnActive
        : EMPLOYEE_STATUS.Active,
    father_name: (() => {
      const a = String(d.father_name ?? "").trim();
      const b = String(d.family_father_name ?? "").trim();
      return a || b;
    })(),
    dob: String(d.dob ?? ""),
    cnic_no: normalizeCnicFromDb(String(d.cnic_no ?? "")),
    ss_eubi_no: String(d.ss_eubi_no ?? ""),
    basic_salary: String(d.basic_salary ?? ""),
    phone_no: normalizePhoneFromDb(String(d.phone_no ?? "")),
    city: String(d.city ?? ""),
    address: String(d.address ?? ""),
    department: String(d.department ?? ""),
    section: String(d.section ?? ""),
    education: String(d.education ?? ""),
    experience: String(d.experience ?? ""),
    social_instagram: String(sl.instagram ?? ""),
    social_facebook: String(sl.facebook ?? ""),
    social_tiktok: String(sl.tiktok ?? ""),
    social_youtube: String(sl.youtube ?? ""),
    social_snapchat: String(sl.snapchat ?? ""),
    social_twitter: String(sl.twitter ?? ""),
    email_address: String(d.email_address ?? ""),
    reference_info: String(d.reference_info ?? ""),
    family_cnic: normalizeCnicFromDb(String(d.family_cnic ?? "")),
    family_phone: normalizePhoneFromDb(String(d.family_phone ?? "")),
    family_phone_alt: normalizePhoneFromDb(String(d.family_phone_alt ?? "")),
    profile_image: String(d.profile_image ?? ""),
    cnic_front: String(d.cnic_front ?? ""),
    cnic_back: String(d.cnic_back ?? ""),
    father_image: String(d.father_image ?? ""),
    father_cnic_front: String(d.father_cnic_front ?? ""),
    father_cnic_back: String(d.father_cnic_back ?? ""),
    additional_document: extractAdditionalDocUrl(d.other_documents),
  };
}
