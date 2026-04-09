"use client";

import {
  EMPLOYEE_COLUMN_IDS,
  ensureFixedColumnVisibility,
  type EmployeeColumnId,
} from "@/lib/employee-table-columns";

function columnMinClass(colId: EmployeeColumnId): string {
  switch (colId) {
    case "image":
      return "min-w-[3.5rem]";
    case "social":
      return "min-w-[4.5rem]";
    case "action":
      return "min-w-[3.25rem]";
    case "status":
      return "min-w-[6.5rem]";
    case "basic_salary":
      return "min-w-[7.5rem]";
    default:
      return "min-w-[150px]";
  }
}

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className ?? "h-4 w-full"}`}
    />
  );
}

/**
 * Loading placeholder matching the employees table layout (visible columns + row count).
 */
export function EmployeesTableSkeleton({
  visibility,
  rowCount,
  embedInCard = false,
}: {
  visibility: Record<EmployeeColumnId, boolean>;
  /** Usually matches current page size (e.g. 50). */
  rowCount: number;
  embedInCard?: boolean;
}) {
  const effective = ensureFixedColumnVisibility(visibility);
  const visibleIds = EMPLOYEE_COLUMN_IDS.filter((id) => effective[id] === true);
  const cols =
    visibleIds.length > 0 ? visibleIds : (["image", "name"] as EmployeeColumnId[]);
  const rows = Math.max(1, Math.min(rowCount, 100));

  const thBase =
    "whitespace-nowrap px-4 py-3 align-middle text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400";
  const tdBase = "whitespace-nowrap px-4 py-3 align-middle";

  const shellClass = embedInCard
    ? "bg-white dark:bg-slate-900"
    : "rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]";

  return (
    <div className={["min-w-0 w-full", shellClass].join(" ")} aria-busy="true" aria-label="Loading employees">
      <div className="w-full min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80">
              {cols.map((colId) => (
                <th
                  key={colId}
                  scope="col"
                  className={[thBase, columnMinClass(colId)].join(" ")}
                >
                  <Pulse className="mx-auto h-3 w-16 max-w-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, ri) => (
              <tr
                key={ri}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
              >
                {cols.map((colId) => (
                  <td
                    key={colId}
                    className={[tdBase, columnMinClass(colId)].join(" ")}
                  >
                    {colId === "image" ? (
                      <Pulse className="h-10 w-10 shrink-0 rounded-full" />
                    ) : (
                      <Pulse
                        className={
                          colId === "action"
                            ? "ml-auto h-8 w-8 rounded-lg"
                            : "h-4 w-[min(100%,12rem)]"
                        }
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sr-only">Loading employee data…</p>
    </div>
  );
}
