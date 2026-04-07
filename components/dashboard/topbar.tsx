"use client";

import { usePathname } from "next/navigation";
import { Menu, UserCircle } from "lucide-react";
import { useTopbarEndSlot } from "./topbar-slot-context";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Employee Management",
  "/employees/new": "Add employee",
  "/settings": "Settings",
  "/configuration": "Configuration",
};

function titleForPath(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/employees/new")) return "Add employee";
  if (/^\/employees\/[^/]+\/edit$/.test(pathname)) return "Edit employee";
  if (pathname.startsWith("/employees/")) return "Employee";
  if (pathname.startsWith("/configuration")) return "Configuration";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  return "Dashboard";
}

type TopbarProps = {
  mobileOpen: boolean;
  onMenuClick: () => void;
};

export function Topbar({ mobileOpen, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const title = titleForPath(pathname);
  const { endSlot } = useTopbarEndSlot();

  return (
    <header className="sticky top-0 z-30 flex h-[3.75rem] shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 sm:gap-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={onMenuClick}
          aria-expanded={mobileOpen}
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
      </div>

      <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
        {endSlot ? (
          <div className="flex min-w-0 max-w-[min(100vw-10rem,28rem)] flex-wrap items-center justify-end gap-2 sm:max-w-[min(100vw-12rem,32rem)] md:max-w-none md:flex-nowrap">
            {endSlot}
          </div>
        ) : null}
        <div
          className="flex shrink-0 items-center gap-2.5 rounded-full border border-slate-200/90 bg-slate-50/80 py-1.5 pl-2 pr-3.5 dark:border-slate-700 dark:bg-slate-900/80"
          role="status"
          aria-label="Admin profile (placeholder)"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600">
            <UserCircle className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
              Admin
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Profile
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
