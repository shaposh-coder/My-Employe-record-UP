import type { EmployeeListRow } from "@/components/employees/employee-list-row";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";
import {
  SOCIAL_LINK_KEYS,
  SOCIAL_PLATFORM_LABELS,
  type SocialLinksRecord,
  normalizeSocialLinksForDb,
} from "@/lib/social-links";
import {
  CNIC_FORMAT_REGEX,
  normalizeCnicFromDb,
  normalizePhoneFromDb,
} from "@/lib/format-cnic-phone";

/** Valid Pakistani CNIC after normalizing user / CSV input. */
export function normalizeImportCnic(raw: string): string | null {
  if (!raw?.trim()) return null;
  const cnic = normalizeCnicFromDb(raw.trim());
  return CNIC_FORMAT_REGEX.test(cnic) ? cnic : null;
}

/** Social column headers in CSV (same labels as add-employee form). */
const SOCIAL_HEADERS = SOCIAL_LINK_KEYS.map((k) => SOCIAL_PLATFORM_LABELS[k]);

/**
 * Same fields as add-employee form, excluding images & document uploads.
 * CNIC# first for import matching; otherwise order follows the form (personal → work → social → reference → family).
 */
export const EMPLOYEES_CSV_HEADERS = [
  "CNIC#",
  "Full Name",
  "Status",
  "Father Name",
  "DOB",
  "SS/EOBI No",
  "Phone",
  "City",
  "Address",
  "Department",
  "Section",
  "Education",
  "Experience",
  ...SOCIAL_HEADERS,
  "Email",
  "Reference",
  "Family CNIC",
  "Family Phone",
  "Family Phone Alt",
] as const;

export type EmployeesCsvHeaderKey = (typeof EMPLOYEES_CSV_HEADERS)[number];

const HEADER_ALIASES: Record<string, EmployeesCsvHeaderKey> = {
  "cnic#": "CNIC#",
  cnic: "CNIC#",
  cnic_no: "CNIC#",
  "cnic no": "CNIC#",
  "full name": "Full Name",
  full_name: "Full Name",
  name: "Full Name",
  status: "Status",
  "father name": "Father Name",
  father_name: "Father Name",
  dob: "DOB",
  "date of birth": "DOB",
  phone: "Phone",
  phone_no: "Phone",
  "phone number": "Phone",
  city: "City",
  address: "Address",
  department: "Department",
  section: "Section",
  education: "Education",
  experience: "Experience",
  email: "Email",
  email_address: "Email",
  "ss/eubi no": "SS/EOBI No",
  "ss/eobi no": "SS/EOBI No",
  ss_eubi_no: "SS/EOBI No",
  reference: "Reference",
  reference_info: "Reference",
  instagram: SOCIAL_PLATFORM_LABELS.instagram,
  social_instagram: SOCIAL_PLATFORM_LABELS.instagram,
  facebook: SOCIAL_PLATFORM_LABELS.facebook,
  social_facebook: SOCIAL_PLATFORM_LABELS.facebook,
  tiktok: SOCIAL_PLATFORM_LABELS.tiktok,
  social_tiktok: SOCIAL_PLATFORM_LABELS.tiktok,
  youtube: SOCIAL_PLATFORM_LABELS.youtube,
  social_youtube: SOCIAL_PLATFORM_LABELS.youtube,
  snapchat: SOCIAL_PLATFORM_LABELS.snapchat,
  social_snapchat: SOCIAL_PLATFORM_LABELS.snapchat,
  twitter: SOCIAL_PLATFORM_LABELS.twitter,
  "x / twitter": SOCIAL_PLATFORM_LABELS.twitter,
  social_twitter: SOCIAL_PLATFORM_LABELS.twitter,
  "family cnic": "Family CNIC",
  family_cnic: "Family CNIC",
  "family phone": "Family Phone",
  family_phone: "Family Phone",
  "family phone alt": "Family Phone Alt",
  family_phone_alt: "Family Phone Alt",
};

function normalizeHeaderLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function resolveCsvHeader(cell: string): EmployeesCsvHeaderKey | null {
  const n = normalizeHeaderLabel(cell);
  if (HEADER_ALIASES[n]) return HEADER_ALIASES[n];
  const direct = EMPLOYEES_CSV_HEADERS.find(
    (h) => normalizeHeaderLabel(h) === n,
  );
  return direct ?? null;
}

export function escapeCsvCell(value: string): string {
  const s = value ?? "";
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowToCsvLine(values: string[]): string {
  return values.map(escapeCsvCell).join(",");
}

function socialCell(row: EmployeeListRow, key: (typeof SOCIAL_LINK_KEYS)[number]): string {
  const v = row.social_links?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

export function employeeRowToCsvValues(row: EmployeeListRow): string[] {
  return [
    row.cnic_no,
    row.full_name,
    row.status ?? EMPLOYEE_STATUS.Active,
    row.father_name ?? "",
    row.dob ?? "",
    row.ss_eubi_no ?? "",
    row.phone_no ?? "",
    row.city ?? "",
    row.address ?? "",
    row.department,
    row.section ?? "",
    row.education ?? "",
    row.experience ?? "",
    ...SOCIAL_LINK_KEYS.map((k) => socialCell(row, k)),
    row.email_address ?? "",
    row.reference_info ?? "",
    row.family_cnic ?? "",
    row.family_phone ?? "",
    row.family_phone_alt ?? "",
  ];
}

export function buildEmployeesCsv(rows: EmployeeListRow[]): string {
  const lines = [
    rowToCsvLine([...EMPLOYEES_CSV_HEADERS]),
    ...rows.map((r) => rowToCsvLine(employeeRowToCsvValues(r))),
  ];
  return lines.join("\r\n");
}

/** One CSV row (commas; quotes for fields that contain commas). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** Splits a full CSV file into rows (newline-separated records). */
export function parseCsvText(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized
    .split("\n")
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

export type ParsedImportRow = {
  byHeader: Partial<Record<EmployeesCsvHeaderKey, string>>;
};

export function parseEmployeesCsvForImport(text: string): {
  headers: EmployeesCsvHeaderKey[];
  rows: ParsedImportRow[];
  error: string | null;
} {
  const grid = parseCsvText(text);
  if (grid.length < 2) {
    return {
      headers: [],
      rows: [],
      error: "File is empty or has no data rows.",
    };
  }
  const rawHeader = grid[0];
  const headers: EmployeesCsvHeaderKey[] = [];
  const colIndexToHeader: (EmployeesCsvHeaderKey | null)[] = [];
  for (const h of rawHeader) {
    const key = resolveCsvHeader(h);
    colIndexToHeader.push(key);
    if (key && !headers.includes(key)) headers.push(key);
  }
  if (!headers.includes("CNIC#")) {
    return {
      headers: [],
      rows: [],
      error: 'Missing required column "CNIC#" (CNIC).',
    };
  }

  const rows: ParsedImportRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const line = grid[r];
    const byHeader: Partial<Record<EmployeesCsvHeaderKey, string>> = {};
    for (let c = 0; c < colIndexToHeader.length; c++) {
      const hk = colIndexToHeader[c];
      if (!hk) continue;
      const v = line[c];
      if (v != null && String(v).trim() !== "") {
        byHeader[hk] = String(v).trim();
      }
    }
    rows.push({ byHeader });
  }
  return { headers, rows, error: null };
}

function str(v: string | undefined): string | null {
  if (v == null || v.trim() === "") return null;
  return v.trim();
}

/**
 * Social URLs from CSV columns (add form social fields → `social_links` JSON).
 */
export function csvRowToSocialLinksPatch(
  byHeader: Partial<Record<EmployeesCsvHeaderKey, string>>,
): SocialLinksRecord | null {
  const input: Partial<
    Record<
      "instagram" | "facebook" | "tiktok" | "youtube" | "snapchat" | "twitter",
      string
    >
  > = {};
  for (const key of SOCIAL_LINK_KEYS) {
    const label = SOCIAL_PLATFORM_LABELS[key] as EmployeesCsvHeaderKey;
    const v = byHeader[label]?.trim();
    if (v) input[key] = v;
  }
  return normalizeSocialLinksForDb(input);
}

/** Scalar `employees` columns from CSV (no `social_links`). */
export function csvRowToEmployeePatch(
  byHeader: Partial<Record<EmployeesCsvHeaderKey, string>>,
): Record<string, string | null> {
  const patch: Record<string, string | null> = {};
  const set = (db: string, v: string | undefined) => {
    const t = str(v);
    if (t !== null) patch[db] = t;
  };
  set("full_name", byHeader["Full Name"]);
  const st = byHeader["Status"]?.trim();
  if (st) {
    const lower = st.toLowerCase();
    if (
      lower === "active" ||
      lower === EMPLOYEE_STATUS.Active.toLowerCase()
    ) {
      patch.status = EMPLOYEE_STATUS.Active;
    } else if (
      lower === "un-active" ||
      lower === "unactive" ||
      lower === "inactive" ||
      lower === EMPLOYEE_STATUS.UnActive.toLowerCase()
    ) {
      patch.status = EMPLOYEE_STATUS.UnActive;
    } else {
      patch.status = st;
    }
  }
  set("father_name", byHeader["Father Name"]);
  set("dob", byHeader["DOB"]);
  set("ss_eubi_no", byHeader["SS/EOBI No"]);
  const phone = byHeader["Phone"];
  if (phone?.trim()) {
    patch.phone_no = normalizePhoneFromDb(phone);
  }
  set("city", byHeader["City"]);
  set("address", byHeader["Address"]);
  set("department", byHeader["Department"]);
  set("section", byHeader["Section"]);
  set("education", byHeader["Education"]);
  set("experience", byHeader["Experience"]);
  set("email_address", byHeader["Email"]);
  set("reference_info", byHeader["Reference"]);
  const famCnic = byHeader["Family CNIC"];
  if (famCnic?.trim()) {
    patch.family_cnic = normalizeCnicFromDb(famCnic);
  }
  const famPhone = byHeader["Family Phone"];
  if (famPhone?.trim()) {
    patch.family_phone = normalizePhoneFromDb(famPhone);
  }
  const famPhoneAlt = byHeader["Family Phone Alt"];
  if (famPhoneAlt?.trim()) {
    patch.family_phone_alt = normalizePhoneFromDb(famPhoneAlt);
  }
  return patch;
}

/** Whether CSV row has minimum fields to create a new employee (matches add form required text fields). */
export function csvRowHasRequiredFieldsForInsert(
  patch: Record<string, string | null>,
): boolean {
  const need = [
    "full_name",
    "father_name",
    "dob",
    "phone_no",
    "city",
    "address",
    "department",
    "section",
  ] as const;
  for (const k of need) {
    const v = patch[k];
    if (v == null || String(v).trim() === "") return false;
  }
  return true;
}
