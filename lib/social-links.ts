/** Keys stored in `employees.social_links` JSON. */
export const SOCIAL_LINK_KEYS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "snapchat",
  "twitter",
] as const;

export type SocialLinkKey = (typeof SOCIAL_LINK_KEYS)[number];

export type SocialLinksRecord = Partial<Record<SocialLinkKey, string | null>>;

export function normalizeSocialLinksForDb(input: {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  snapchat?: string;
  twitter?: string;
}): SocialLinksRecord | null {
  const out: SocialLinksRecord = {};
  for (const key of SOCIAL_LINK_KEYS) {
    const v = input[key]?.trim();
    if (v) out[key] = v;
  }
  return Object.keys(out).length ? out : null;
}
