"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Share2, X } from "lucide-react";
import {
  SOCIAL_LINK_KEYS,
  SOCIAL_PLATFORM_LABELS,
  type SocialLinkKey,
  type SocialLinksRecord,
} from "@/lib/social-links";
import { SocialPlatformIcon } from "./social-platform-icons";

type LinkItem =
  | { kind: "platform"; key: SocialLinkKey; url: string }
  | { kind: "legacy"; url: string };

function collectLinks(
  social_links: SocialLinksRecord | null,
  social_media_link: string | null,
): LinkItem[] {
  const out: LinkItem[] = [];
  const sl = social_links;
  if (sl && typeof sl === "object") {
    for (const k of SOCIAL_LINK_KEYS) {
      const v = sl[k]?.trim();
      if (v) out.push({ kind: "platform", key: k, url: v });
    }
  }
  if (out.length === 0 && social_media_link?.trim()) {
    out.push({ kind: "legacy", url: social_media_link.trim() });
  }
  return out;
}

export function EmployeeSocialLinksCell({
  full_name,
  profile_image,
  social_links,
  social_media_link,
}: {
  full_name: string;
  profile_image: string | null;
  social_links: SocialLinksRecord | null;
  social_media_link: string | null;
}) {
  const links = collectLinks(social_links, social_media_link);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (links.length === 0) {
    return (
      <span className="text-slate-400 dark:text-slate-500">—</span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={`Social links for ${full_name}`}
      >
        <Share2 className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-social-modal-title"
            className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>

            <div className="flex flex-col items-center gap-4 pt-2">
              {profile_image?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile_image.trim()}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-600"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {full_name.trim().slice(0, 2).toUpperCase() || "?"}
                </div>
              )}
              <h2
                id="employee-social-modal-title"
                className="text-center text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {full_name}
              </h2>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Tap an icon to open in a new tab
              </p>

              <ul className="flex w-full flex-wrap justify-center gap-4">
                {links.map((item, i) => (
                  <li key={item.kind === "platform" ? item.key : `legacy-${i}`}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white dark:border-slate-600 dark:bg-slate-800/80 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                    >
                      {item.kind === "platform" ? (
                        <>
                          <SocialPlatformIcon platform={item.key} />
                          <span className="max-w-[6rem] text-center text-xs font-medium text-slate-700 dark:text-slate-200">
                            {SOCIAL_PLATFORM_LABELS[item.key]}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-sm dark:bg-slate-600">
                            <ExternalLink className="h-5 w-5" strokeWidth={2} />
                          </span>
                          <span className="max-w-[6rem] text-center text-xs font-medium text-slate-700 dark:text-slate-200">
                            Social link
                          </span>
                        </>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
