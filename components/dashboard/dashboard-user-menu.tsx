"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { Loader2, LogOut, User, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserAccess } from "./user-access-context";

export function DashboardUserMenu() {
  const router = useRouter();
  const { email, fullName, avatarUrl } = useUserAccess();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setSigningOut(false);
  }, [router]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/90 bg-slate-50 shadow-sm ring-offset-2 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:focus-visible:ring-slate-500"
          aria-label="Account menu"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic Supabase URL
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle
              className="h-6 w-6 text-slate-500 dark:text-slate-400"
              strokeWidth={1.5}
              aria-hidden
            />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[200] w-[13rem] overflow-hidden rounded-xl border border-slate-200/90 bg-white p-1 shadow-lg outline-none dark:border-slate-600 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {fullName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {email}
            </p>
          </div>
          <Link
            href="/profile"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} />
            Profile
          </Link>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} />
            )}
            Sign out
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
