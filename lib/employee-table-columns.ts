/** Column visibility for Employees directory table (persisted in localStorage). */

export const EMPLOYEES_COLUMN_VISIBILITY_KEY = "ems:employees:columns:v1";

export const EMPLOYEE_COLUMN_IDS = [
  "image",
  "name",
  "father_name",
  "dob",
  "cnic",
  "ss_eubi",
  "phone",
  "city",
  "department",
  "section",
  "education",
  "address",
  "experience",
  "social",
  "email",
  "reference",
  "fam_father",
  "fam_cnic",
  "fam_phone",
  "fam_phone_alt",
  "status",
  "action",
] as const;

export type EmployeeColumnId = (typeof EMPLOYEE_COLUMN_IDS)[number];

export const EMPLOYEE_COLUMN_LABELS: Record<EmployeeColumnId, string> = {
  image: "IMAGE",
  name: "NAME",
  father_name: "FATHER NAME",
  dob: "DATE OF BIRTH",
  cnic: "CNIC#",
  ss_eubi: "SOCIAL SECURITY / EUBI",
  phone: "PHONE NUMBER",
  city: "CITY",
  department: "DEPARTMENT",
  section: "SECTION",
  education: "EDUCATION",
  address: "ADDRESS",
  experience: "EXPERIENCE",
  social: "SOCIAL MEDIA",
  email: "EMAIL ADDRESS",
  reference: "REFERENCE",
  fam_father: "FATHER NAME",
  fam_cnic: "FATHER CNIC",
  fam_phone: "PHONE (MAIN)",
  fam_phone_alt: "PHONE (ALT)",
  status: "STATUS",
  action: "ACTION",
};

const DEFAULT_VISIBLE = new Set<EmployeeColumnId>([
  "image",
  "name",
  "city",
  "department",
  "section",
  "phone",
  "status",
  "action",
]);

export function defaultColumnVisibility(): Record<EmployeeColumnId, boolean> {
  const v = {} as Record<EmployeeColumnId, boolean>;
  for (const id of EMPLOYEE_COLUMN_IDS) {
    v[id] = DEFAULT_VISIBLE.has(id);
  }
  return v;
}

export function loadColumnVisibility(): Record<EmployeeColumnId, boolean> {
  const base = defaultColumnVisibility();
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(EMPLOYEES_COLUMN_VISIBILITY_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<
      Record<EmployeeColumnId, boolean>
    >;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

export function saveColumnVisibility(
  v: Record<EmployeeColumnId, boolean>,
): void {
  localStorage.setItem(EMPLOYEES_COLUMN_VISIBILITY_KEY, JSON.stringify(v));
}
