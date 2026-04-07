import Link from "next/link";
import { Building2, Layers } from "lucide-react";
import type { DeptSectionBreakdownRow } from "@/lib/dashboard-dept-section-counts";
import { employeesDirectoryHref } from "@/lib/employees-directory-url";

type Props = {
  departmentRows: DeptSectionBreakdownRow[];
  sectionRows: DeptSectionBreakdownRow[];
};

const cardShell =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]";

const thClass =
  "border-b border-slate-200 bg-slate-50/95 px-3 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300";

const tdPad = "border-b border-slate-100 p-0 dark:border-slate-800";

const linkName =
  "block w-full px-3 py-2.5 text-left text-base leading-snug text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500";

const linkNum =
  "block w-full px-3 py-2.5 text-right text-lg font-semibold tabular-nums leading-snug text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 dark:text-slate-100 dark:hover:bg-slate-800/50 dark:focus-visible:ring-slate-500";

function BreakdownTable({
  rows,
  nameHeader,
  dimension,
}: {
  rows: DeptSectionBreakdownRow[];
  nameHeader: string;
  dimension: "department" | "section";
}) {
  const dimArg =
    dimension === "department"
      ? { department: "" as string }
      : { section: "" as string };

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[16rem] border-collapse text-left">
        <thead className="sticky top-0 z-10">
          <tr>
            <th scope="col" className={thClass}>
              {nameHeader}
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
              const base =
                dimension === "department"
                  ? { department: row.title }
                  : { section: row.title };
              const hrefName = employeesDirectoryHref(base);
              const hrefActive = employeesDirectoryHref({
                ...base,
                status: "active",
              });
              const hrefUnActive = employeesDirectoryHref({
                ...base,
                status: "un-active",
              });
              const labelSuffix =
                dimension === "department" ? "department" : "section";
              return (
                <tr key={row.title}>
                  <td className={tdPad}>
                    <Link
                      href={hrefName}
                      className={linkName}
                      title={`Employees in ${row.title} (${labelSuffix})`}
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className={tdPad}>
                    <Link
                      href={hrefActive}
                      className={linkNum}
                      title={`Active employees — ${row.title}`}
                    >
                      {row.active}
                    </Link>
                  </td>
                  <td className={tdPad}>
                    <Link
                      href={hrefUnActive}
                      className={linkNum}
                      title={`Un-Active employees — ${row.title}`}
                    >
                      {row.unActive}
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardDeptSectionStats({
  departmentRows,
  sectionRows,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
      <div className={cardShell}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 px-4 py-3.5 dark:border-slate-700/80">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Department
          </p>
          <div
            className="shrink-0 rounded-xl bg-indigo-100/90 p-2.5 dark:bg-indigo-950/45"
            aria-hidden
          >
            <Building2 className="h-6 w-6 text-indigo-700 dark:text-indigo-400" />
          </div>
        </div>
        <BreakdownTable
          rows={departmentRows}
          nameHeader="Department"
          dimension="department"
        />
      </div>

      <div className={cardShell}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 px-4 py-3.5 dark:border-slate-700/80">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Section
          </p>
          <div
            className="shrink-0 rounded-xl bg-violet-100/90 p-2.5 dark:bg-violet-950/40"
            aria-hidden
          >
            <Layers className="h-6 w-6 text-violet-800 dark:text-violet-400" />
          </div>
        </div>
        <BreakdownTable
          rows={sectionRows}
          nameHeader="Section"
          dimension="section"
        />
      </div>
    </div>
  );
}
