"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";
import { useUserAccess } from "./user-access-context";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Database,
} from "lucide-react";
import { ThemeToggle } from "@/src/components/ThemeToggle";

const nav: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/configuration", label: "Configuration", icon: Database },
  { href: "/settings", label: "Users", icon: UserCog },
];

function navItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  mobileOpen: boolean;
  onNavigate: () => void;
};

function navVisibleForRole(
  href: string,
  role: "admin" | "manager" | "viewer",
): boolean {
  if (href === "/configuration") {
    return role === "admin" || role === "manager";
  }
  if (href === "/settings") {
    return role === "admin";
  }
  return true;
}

function SidebarComponent({ mobileOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useUserAccess();

  const navItems = useMemo(
    () => nav.filter((item) => navVisibleForRole(item.href, role)),
    [role],
  );

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200/70 bg-white shadow-[2px_0_24px_-8px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 md:static md:z-auto md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      <div className="flex shrink-0 flex-col gap-1 border-b border-slate-100 px-4 py-7 dark:border-slate-800 sm:px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex min-h-[3.75rem] min-w-0 flex-col justify-center gap-0.5 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-slate-400 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-500"
        >
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[1.65rem]">
            ERS
          </span>
          <span className="text-[0.7rem] font-medium leading-snug text-slate-600 dark:text-slate-400 sm:text-xs">
            Employee Record System
          </span>
          <span className="sr-only"> — go to dashboard</span>
        </Link>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1.5 p-4 pt-6"
        aria-label="Primary"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = navItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={[
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-50/90 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  active
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300",
                ].join(" ")}
                strokeWidth={1.75}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-100 px-4 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Theme
          </span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
