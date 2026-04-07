"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TopbarEndSlotProvider } from "./topbar-slot-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] md:hidden dark:bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <TopbarEndSlotProvider>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <Topbar
            mobileOpen={mobileOpen}
            onMenuClick={() => setMobileOpen((open) => !open)}
          />
          <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
            {children}
          </main>
        </div>
      </TopbarEndSlotProvider>
    </div>
  );
}
