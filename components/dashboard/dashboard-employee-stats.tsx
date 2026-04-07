import Link from "next/link";
import { UserCheck, UserMinus, Users } from "lucide-react";

type Props = {
  total: number;
  active: number;
  unActive: number;
};

const cardBase =
  "block rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)] dark:hover:border-slate-600 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900";

export function DashboardEmployeeStats({ total, active, unActive }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link href="/employees" className={cardBase} aria-label="Open employees directory">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              Total Employee
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {total}
            </p>
          </div>
          <div
            className="shrink-0 rounded-xl bg-slate-100 p-3 dark:bg-slate-800"
            aria-hidden
          >
            <Users className="h-6 w-6 text-slate-600 dark:text-slate-300" />
          </div>
        </div>
      </Link>

      <Link
        href="/employees?status=active"
        className={cardBase}
        aria-label="Open employees filtered by active status"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              Active Employee
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {active}
            </p>
          </div>
          <div
            className="shrink-0 rounded-xl bg-emerald-100/90 p-3 dark:bg-emerald-950/50"
            aria-hidden
          >
            <UserCheck className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
          </div>
        </div>
      </Link>

      <Link
        href="/employees?status=un-active"
        className={cardBase}
        aria-label="Open employees filtered by Un-Active status"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-medium text-slate-600 dark:text-slate-400">
              Un-Active Employee
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {unActive}
            </p>
          </div>
          <div
            className="shrink-0 rounded-xl bg-amber-100/90 p-3 dark:bg-amber-950/40"
            aria-hidden
          >
            <UserMinus className="h-6 w-6 text-amber-800 dark:text-amber-400" />
          </div>
        </div>
      </Link>
    </div>
  );
}
