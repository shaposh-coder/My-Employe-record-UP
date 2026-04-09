/** Trim + collapse internal whitespace (so "  IT  " and "IT" match as duplicates). */
export function formatTitleForStorage(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function normalizeTitleKey(raw: string): string {
  return formatTitleForStorage(raw).toLowerCase();
}
