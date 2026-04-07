"use client";

import { useCallback, useState } from "react";
import type { UserAccessContextValue } from "./user-access-context";
import { NavigationProgress } from "./navigation-progress";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TopbarEndSlotProvider } from "./topbar-slot-context";
import { UserAccessProvider } from "./user-access-context";

/**
 * Shell layout: sidebar + topbar are siblings of the route `children` segment
 * so they stay mounted across navigations; only `main` content swaps (see
 * per-route loading.tsx under employees/*).
 */
export function DashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: UserAccessContextValue;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((open) => !open), []);

  return (
    <UserAccessProvider profile={profile}>
      <div className="flex min-h-[100dvh] w-full bg-background text-foreground">
        <NavigationProgress />
        <Sidebar mobileOpen={mobileOpen} onNavigate={closeMobile} />

        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] md:hidden dark:bg-black/60"
            onClick={closeMobile}
          />
        ) : null}

        <TopbarEndSlotProvider>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
            <Topbar mobileOpen={mobileOpen} onMenuClick={toggleMobile} />
            <main className="flex min-h-0 flex-1 flex-col bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
              {children}
            </main>
          </div>
        </TopbarEndSlotProvider>
      </div>
    </UserAccessProvider>
  );
}
