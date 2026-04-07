"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EmployeesPageSize } from "@/lib/fetch-employees";

/** Build page numbers with ellipsis for a compact pager. */
function getVisiblePages(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 0) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) {
      out.push("ellipsis");
    }
    out.push(p);
    prev = p;
  }
  return out;
}

const btnGhost =
  "inline-flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500";

const btnPrimary =
  "inline-flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-lg border border-slate-900 bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white";

const iconNav =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus-visible:ring-slate-500";

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

  const visiblePages = getVisiblePages(safePage, totalPages);

  return (
    <footer
      role="navigation"
      aria-label="Table pagination"
      className="shrink-0 border-t border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-slate-50 px-4 py-4 dark:border-slate-700/80 dark:from-slate-950/80 dark:to-slate-950 sm:px-5 sm:py-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        {/* Left: summary */}
        <p className="text-left text-sm text-slate-600 dark:text-slate-400 lg:shrink-0">
          {total === 0 ? (
            <span className="tabular-nums">No records</span>
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {from}–{to}
              </span>{" "}
              of{" "}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {total}
              </span>
            </>
          )}
        </p>

        {/* Center: page controls */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 sm:gap-1">
            <button
              type="button"
              disabled={disabled || safePage <= 1 || total === 0}
              onClick={() => onPageChange(safePage - 1)}
              className={iconNav}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>

            {total > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-0.5 px-0.5 sm:gap-1">
                {visiblePages.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`e-${idx}`}
                      className="flex h-9 min-w-[2.25rem] items-center justify-center text-sm text-slate-400 dark:text-slate-500"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      disabled={disabled}
                      onClick={() => onPageChange(item)}
                      className={
                        item === safePage
                          ? btnPrimary
                          : `${btnGhost} tabular-nums`
                      }
                      aria-label={`Page ${item}`}
                      aria-current={item === safePage ? "page" : undefined}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            ) : null}

            <button
              type="button"
              disabled={
                disabled || safePage >= totalPages || total === 0
              }
              onClick={() => onPageChange(safePage + 1)}
              className={iconNav}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Right: rows per page */}
        <div className="flex items-center justify-center gap-2 lg:ml-auto lg:shrink-0 lg:justify-end">
          <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Rows per page
          </span>
          <select
            value={pageSize}
            disabled={disabled}
            aria-label="Rows per page"
            onChange={(e) =>
              onPageSizeChange(Number(e.target.value) as EmployeesPageSize)
            }
            className="h-9 min-w-[4.5rem] cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 text-center text-sm font-medium text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/80 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-600/50"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </footer>
  );
}
