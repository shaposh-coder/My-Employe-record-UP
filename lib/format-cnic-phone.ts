/** Pakistani CNIC display: 5 digits - 7 digits - 1 digit (e.g. 33203-1234567-5) */
export const CNIC_FORMAT_REGEX = /^\d{5}-\d{7}-\d{1}$/;

/** Local mobile: 4 digits - 7 digits (e.g. 0305-1234567) */
export const PHONE_FORMAT_REGEX = /^\d{4}-\d{7}$/;

const MAX_CNIC_DIGITS = 13;
const MAX_PHONE_DIGITS = 11;

/**
 * Formats raw input as user types: digits only, hyphens inserted automatically.
 */
export function formatCnicInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, MAX_CNIC_DIGITS);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/**
 * Formats phone: 4 digits, hyphen, 7 digits.
 */
export function formatPhoneInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

/** Normalize DB / legacy value for controlled fields (digits-only or already formatted). */
export function normalizeCnicFromDb(value: string): string {
  return formatCnicInput(value);
}

export function normalizePhoneFromDb(value: string): string {
  return formatPhoneInput(value);
}
