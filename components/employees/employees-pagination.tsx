"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EmployeesPageSize } from "@/lib/fetch-employees";

export function EmployeesPagination({
  page,
  pageSize,
  pageSizeOptions,
  total,
  onPageChange,
  onPageSizeChange,
  disabled,
}: {
  page: number;
  pageSize: number;
  pageSizeOptions: readonly EmployeesPageSize[];
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: EmployeesPageSize) => void;
  disabled?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="mt-4 flex flex-col items-stretch justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 sm:text-left">
          {total === 0 ? (
            <>No records</>
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {from}–{to}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {total}
              </span>
            </>
          )}
        </p>
        <label className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 sm:justify-start">
          <span className="whitespace-nowrap">Per page</span>
          <select
            value={pageSize}
            disabled={disabled}
            aria-label="Records per page"
            onChange={(e) =>
              onPageSizeChange(Number(e.target.value) as EmployeesPageSize)
            }
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-600"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-center gap-2 sm:justify-end">
        <button
          type="button"
          disabled={disabled || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Previous
        </button>
        <span className="min-w-[5rem] text-center text-sm tabular-nums text-slate-600 dark:text-slate-400">
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={disabled || safePage >= totalPages || total === 0}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Next
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
