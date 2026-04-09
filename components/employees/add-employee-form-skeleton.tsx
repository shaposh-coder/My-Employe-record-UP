/**
 * Matches the add/edit employee form shell so route-level loading UI
 * only replaces the main column, not the dashboard chrome.
 */
export function AddEmployeeFormSkeleton() {
  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-5xl flex-1 flex-col">
      <div className="flex min-h-[28rem] w-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
        <div
          className="flex shrink-0 flex-wrap gap-1 border-b border-slate-100 bg-slate-50/90 p-2 dark:border-slate-800 dark:bg-slate-950/60"
          aria-hidden
        >
          {["a", "b", "c", "d", "e"].map((k) => (
            <div
              key={k}
              className="h-10 w-[5.5rem] rounded-lg bg-slate-200/80 sm:w-28 dark:bg-slate-700/60"
            />
          ))}
        </div>
        <div className="p-6 sm:p-10">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-slate-200/90 dark:bg-slate-700/70" />
                <div className="h-11 w-full rounded-lg bg-slate-100 dark:bg-slate-800/80" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex gap-2">
            <div className="h-10 w-20 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
            <div className="h-10 w-20 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
          </div>
          <div className="flex gap-2">
            <div className="h-12 w-[120px] rounded-xl bg-slate-100 dark:bg-slate-800/80" />
            <div className="h-12 w-[160px] rounded-xl bg-slate-200/90 dark:bg-slate-700/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
