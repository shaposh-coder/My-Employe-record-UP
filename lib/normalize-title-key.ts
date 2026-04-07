/** Matches DB `normalize_title_key`: trim, collapse spaces, lowercase. */
export function normalizeTitleKey(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}
