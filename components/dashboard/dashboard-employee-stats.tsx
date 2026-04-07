import { UserCheck, UserMinus, Users } from "lucide-react";

type Props = {
  total: number;
  active: number;
  deactive: number;
};

const cardBase =
  "rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]";

export function DashboardEmployeeStats({ total, active, deactive }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className={cardBase}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Employee
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {total}
            </p>
          </div>
          <div
            className="shrink-0 rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800"
            aria-hidden
          >
            <Users className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
        </div>
      </div>

      <div className={cardBase}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Active Employee
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {active}
            </p>
          </div>
          <div
            className="shrink-0 rounded-xl bg-emerald-100/90 p-2.5 dark:bg-emerald-950/50"
            aria-hidden
          >
            <UserCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className={cardBase}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Deactive Employee
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {deactive}
            </p>
          </div>
          <div
            className="shrink-0 rounded-xl bg-amber-100/90 p-2.5 dark:bg-amber-950/40"
            aria-hidden
          >
            <UserMinus className="h-5 w-5 text-amber-800 dark:text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
