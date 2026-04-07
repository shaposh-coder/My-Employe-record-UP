"use client";

/**
 * Shown while refetching directory data — keeps previous rows visible underneath.
 */
export function EmployeesTableLoadingOverlay({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-30 h-1 overflow-hidden rounded-t-[inherit] bg-slate-200/95 dark:bg-slate-600/95"
        aria-hidden
      >
        <div className="h-full w-[40%] rounded-full bg-slate-900 dark:bg-slate-100 animate-employees-table-load-slider" />
      </div>
      <div
        className="pointer-events-auto absolute inset-0 z-20 cursor-wait rounded-[inherit] bg-white/40 backdrop-blur-[0.5px] dark:bg-slate-900/45"
        aria-busy="true"
        aria-label="Loading employees"
      />
    </>
  );
}
