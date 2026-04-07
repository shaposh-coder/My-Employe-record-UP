import type { ReactNode } from "react";
import {
  ensureFixedColumnVisibility,
  type EmployeeColumnId,
} from "@/lib/employee-table-columns";
import { EmployeeSocialLinksCell } from "./employee-social-links-cell";
import { EmployeeRowActionsMenu } from "./employee-row-actions-menu";
import type { EmployeeListRow } from "./employee-list-row";

export type { EmployeeListRow };

function fmt(value: string | null | undefined): ReactNode {
  if (value == null || String(value).trim() === "") {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }
  return <span>{value}</span>;
}

function profileImageCell(
  url: string | null | undefined,
  onOpenDetail?: (id: string) => void,
  employeeId?: string,
): ReactNode {
  const u = url?.trim();
  const clickable = Boolean(onOpenDetail && employeeId);

  const inner =
    !u ? (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        —
      </span>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs; avoid next.config remotePatterns churn
      <img
        src={u}
        alt=""
        className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-600"
        loading="lazy"
      />
    );

  if (clickable) {
    return (
      <button
        type="button"
        className="inline-flex rounded-full text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900"
        aria-label="View employee details"
        onClick={() => onOpenDetail!(employeeId!)}
      >
        {inner}
      </button>
    );
  }

  return inner;
}

function statusBadge(status: string | null): ReactNode {
  const s = status ?? "Active";
  const active = s === "Active";
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
          : "inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
      }
    >
      {s}
    </span>
  );
}

type ColDef = {
  id: EmployeeColumnId;
  header: string;
  familyGroup?: boolean;
  cell: (row: EmployeeListRow) => ReactNode;
  thClass?: string;
  tdClass?: string;
};

/** Minimum column widths — auto table layout + horizontal scroll when needed. */
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
    default:
      return "min-w-[150px]";
  }
}

function buildColumnDefs(
  onDelete: (id: string) => void | Promise<void>,
  onEmployeeNameClick: ((id: string) => void) | undefined,
  onToggleStatus: ((row: EmployeeListRow) => void | Promise<void>) | undefined,
  statusUpdatingId: string | null | undefined,
): ColDef[] {
  return [
    {
      id: "image",
      header: "IMAGE",
      thClass: "text-left",
      cell: (row) =>
        profileImageCell(row.profile_image, onEmployeeNameClick, row.id),
      tdClass: "align-middle",
    },
    {
      id: "name",
      header: "NAME",
      cell: (row) =>
        onEmployeeNameClick ? (
          <button
            type="button"
            onClick={() => onEmployeeNameClick(row.id)}
            className="text-left font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
          >
            {fmt(row.full_name)}
          </button>
        ) : (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {fmt(row.full_name)}
          </span>
        ),
    },
    {
      id: "father_name",
      header: "FATHER NAME",
      cell: (row) => fmt(row.father_name),
    },
    {
      id: "dob",
      header: "DATE OF BIRTH",
      cell: (row) => fmt(row.dob),
    },
    {
      id: "cnic",
      header: "CNIC#",
      cell: (row) => (
        <span className="font-mono text-xs">{fmt(row.cnic_no)}</span>
      ),
    },
    {
      id: "ss_eubi",
      header: "SOCIAL SECURITY / EUBI",
      cell: (row) => fmt(row.ss_eubi_no),
    },
    {
      id: "phone",
      header: "PHONE NUMBER",
      cell: (row) => fmt(row.phone_no),
    },
    {
      id: "city",
      header: "CITY",
      cell: (row) => fmt(row.city),
    },
    {
      id: "department",
      header: "DEPARTMENT",
      cell: (row) => fmt(row.department),
    },
    {
      id: "section",
      header: "SECTION",
      cell: (row) => fmt(row.section),
    },
    {
      id: "education",
      header: "EDUCATION",
      cell: (row) => fmt(row.education),
    },
    {
      id: "address",
      header: "ADDRESS",
      cell: (row) => fmt(row.address),
    },
    {
      id: "experience",
      header: "EXPERIENCE",
      cell: (row) => fmt(row.experience),
    },
    {
      id: "social",
      header: "SOCIAL MEDIA",
      cell: (row) => (
        <EmployeeSocialLinksCell
          full_name={row.full_name}
          profile_image={row.profile_image}
          social_links={row.social_links}
          social_media_link={row.social_media_link}
        />
      ),
    },
    {
      id: "email",
      header: "EMAIL ADDRESS",
      cell: (row) => fmt(row.email_address),
    },
    {
      id: "reference",
      header: "REFERENCE",
      cell: (row) => fmt(row.reference_info),
    },
    {
      id: "fam_father",
      header: "FATHER NAME",
      familyGroup: true,
      cell: (row) => fmt(row.family_father_name),
    },
    {
      id: "fam_cnic",
      header: "FATHER CNIC",
      familyGroup: true,
      cell: (row) => (
        <span className="font-mono text-xs">{fmt(row.family_cnic)}</span>
      ),
    },
    {
      id: "fam_phone",
      header: "PHONE (MAIN)",
      familyGroup: true,
      cell: (row) => fmt(row.family_phone),
    },
    {
      id: "fam_phone_alt",
      header: "PHONE (ALT)",
      familyGroup: true,
      cell: (row) => fmt(row.family_phone_alt),
    },
    {
      id: "status",
      header: "STATUS",
      cell: (row) => statusBadge(row.status),
    },
    {
      id: "action",
      header: "ACTION",
      thClass: "text-right",
      tdClass: "whitespace-nowrap text-right align-middle",
      cell: (row) => (
        <EmployeeRowActionsMenu
          row={row}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          statusUpdatingId={statusUpdatingId}
        />
      ),
    },
  ];
}

export function EmployeesTable({
  rows,
  visibility,
  onDelete,
  onEmployeeNameClick,
  onToggleStatus,
  statusUpdatingId,
  /** When true, no outer card border/radius — use inside a parent card with a footer. */
  embedInCard = false,
}: {
  rows: EmployeeListRow[];
  visibility: Record<EmployeeColumnId, boolean>;
  onDelete: (id: string) => void | Promise<void>;
  onEmployeeNameClick?: (id: string) => void;
  /** Toggle between Active and Deactive (database constraint). */
  onToggleStatus?: (row: EmployeeListRow) => void | Promise<void>;
  /** When set, the status button for this row shows a spinner. */
  statusUpdatingId?: string | null;
  embedInCard?: boolean;
}) {
  const defs = buildColumnDefs(
    onDelete,
    onEmployeeNameClick,
    onToggleStatus,
    statusUpdatingId,
  );
  const effectiveVisibility = ensureFixedColumnVisibility(visibility);
  const filtered = defs.filter((d) => effectiveVisibility[d.id] === true);
  const visible =
    filtered.length > 0
      ? filtered
      : defs.filter((d) => d.id === "image" || d.id === "name");
  const firstFamilyIdx = visible.findIndex((d) => d.familyGroup);
  const colCount = Math.max(visible.length, 1);

  const thBase =
    "whitespace-nowrap px-4 py-3 align-middle text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400";
  const tdBase =
    "whitespace-nowrap px-4 py-3 align-middle text-slate-800 dark:text-slate-200";

  const shellClass = embedInCard
    ? "bg-white dark:bg-slate-900"
    : "rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]";

  return (
    <div className={["min-w-0 w-full", shellClass].join(" ")}>
      <div className="w-full min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80">
              {visible.map((col, i) => (
                <th
                  key={col.id}
                  scope="col"
                  className={[
                    thBase,
                    columnMinClass(col.id),
                    col.thClass ?? "",
                    i === firstFamilyIdx && firstFamilyIdx >= 0
                      ? "border-l border-slate-200 dark:border-slate-700"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="whitespace-normal px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                No employees yet. Use the{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Add
                </span>{" "}
                button above.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
              >
                {visible.map((col, i) => (
                  <td
                    key={col.id}
                    className={[
                      tdBase,
                      columnMinClass(col.id),
                      col.tdClass ?? "",
                      i === firstFamilyIdx && firstFamilyIdx >= 0
                        ? "border-l border-slate-100 dark:border-slate-800"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
