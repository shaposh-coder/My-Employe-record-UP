"use client";

import { usePathname } from "next/navigation";
import { memo } from "react";
import { Menu } from "lucide-react";
import { DashboardUserMenu } from "./dashboard-user-menu";
import { useTopbarEndSlot } from "./topbar-slot-context";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/employees/new": "Add employee",
  "/profile": "Profile",
  "/settings": "Users",
  "/configuration": "Configuration",
};

function titleForPath(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/employees/new")) return "Add employee";
  if (pathname.startsWith("/profile")) return "Profile";
  if (/^\/employees\/[^/]+\/edit$/.test(pathname)) return "Edit employee";
  if (pathname.startsWith("/employees/")) return "Employee";
  if (pathname.startsWith("/configuration")) return "Configuration";
  if (pathname.startsWith("/settings")) return "Users";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  return "Dashboard";
}

type TopbarProps = {
  mobileOpen: boolean;
  onMenuClick: () => void;
};

function TopbarComponent({ mobileOpen, onMenuClick }: TopbarProps) {
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
        <DashboardUserMenu />
      </div>
    </header>
  );
}

export const Topbar = memo(TopbarComponent);
