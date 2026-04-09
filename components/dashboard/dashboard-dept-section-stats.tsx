"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import type { DepartmentWithNestedSections } from "@/lib/dashboard-dept-section-counts";
import { employeesDirectoryHref } from "@/lib/employees-directory-url";

type Props = {
  rows: DepartmentWithNestedSections[];
};

const cardShell =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]";

const thClass =
  "border-b border-slate-200 bg-slate-50/95 px-3 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300";

const tdPad = "border-b border-slate-100 p-0 dark:border-slate-800";

const linkName =
  "block w-full px-3 py-2.5 text-left text-base leading-snug text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500";

const linkNameSub =
  "block w-full px-3 py-2 text-left text-sm leading-snug text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500";

const linkNum =
  "block w-full px-3 py-2.5 text-right text-lg font-semibold tabular-nums leading-snug text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 dark:text-slate-100 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500";

const linkNumSub =
  "block w-full px-3 py-2 text-right text-base font-semibold tabular-nums leading-snug text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500";

export function DashboardDeptSectionStats({ rows }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  function toggleDepartment(title: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <div className={cardShell}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 px-4 py-3.5 dark:border-slate-700/80">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Department and Sections
        </p>
        <div
          className="shrink-0 rounded-xl bg-indigo-100/90 p-2.5 dark:bg-indigo-950/45"
          aria-hidden
        >
          <Building2 className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[16rem] border-collapse text-left">
          <thead className="sticky top-0 z-10">
            <tr>
              <th scope="col" className={thClass}>
                Department
              </th>
              <th scope="col" className={`${thClass} text-right`}>
                Active
              </th>
              <th scope="col" className={`${thClass} text-right`}>
                Un-Active
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="border-b border-slate-100 px-3 py-2.5 text-base text-slate-500 dark:border-slate-800 dark:text-slate-400"
                >
                  No rows yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const hasSections = row.sections.length > 0;
                const isOpen = expanded.has(row.title);
                const deptBase = { department: row.title };

                return (
                  <Fragment key={row.title}>
                    <tr>
                      <td className={tdPad}>
                        <div className="flex min-w-0 items-center gap-0.5">
                          {hasSections ? (
                            <button
                              type="button"
                              onClick={() => toggleDepartment(row.title)}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                              aria-expanded={isOpen}
                              aria-label={
                                isOpen
                                  ? `Hide sections for ${row.title}`
                                  : `Show sections for ${row.title}`
                              }
                            >
                              <ChevronRight
                                className={`h-5 w-5 transition-transform duration-200 ${
                                  isOpen ? "rotate-90" : ""
                                }`}
                                aria-hidden
                              />
                            </button>
                          ) : (
                            <span
                              className="inline-flex h-10 w-10 shrink-0"
                              aria-hidden
                            />
                          )}
                          <Link
                            href={employeesDirectoryHref(deptBase)}
                            prefetch
                            className={`${linkName} min-w-0 flex-1`}
                            title={`Employees in ${row.title} (department)`}
                          >
                            {row.title}
                          </Link>
                        </div>
                      </td>
                      <td className={tdPad}>
                        <Link
                          href={employeesDirectoryHref({
                            ...deptBase,
                            status: "active",
                          })}
                          prefetch
                          className={linkNum}
                          title={`Active employees — ${row.title}`}
                        >
                          {row.active}
                        </Link>
                      </td>
                      <td className={tdPad}>
                        <Link
                          href={employeesDirectoryHref({
                            ...deptBase,
                            status: "un-active",
                          })}
                          prefetch
                          className={linkNum}
                          title={`Un-Active employees — ${row.title}`}
                        >
                          {row.unActive}
                        </Link>
                      </td>
                    </tr>
                    {isOpen &&
                      hasSections &&
                      row.sections.map((sec) => {
                        const secFilter = {
                          department: row.title,
                          section: sec.title,
                        };
                        return (
                          <tr
                            key={`${row.title}::${sec.title}`}
                            className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/50"
                          >
                            <td className={tdPad}>
                              <Link
                                href={employeesDirectoryHref(secFilter)}
                                prefetch
                                className={`${linkNameSub} pl-10`}
                                title={`Employees in ${sec.title} (${row.title})`}
                              >
                                {sec.title}
                              </Link>
                            </td>
                            <td className={tdPad}>
                              <Link
                                href={employeesDirectoryHref({
                                  ...secFilter,
                                  status: "active",
                                })}
                                prefetch
                                className={linkNumSub}
                                title={`Active — ${sec.title}`}
                              >
                                {sec.active}
                              </Link>
                            </td>
                            <td className={tdPad}>
                              <Link
                                href={employeesDirectoryHref({
                                  ...secFilter,
                                  status: "un-active",
                                })}
                                prefetch
                                className={linkNumSub}
                                title={`Un-Active — ${sec.title}`}
                              >
                                {sec.unActive}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
