import type { CSSProperties, ReactNode } from "react";
import type { EmployeeColumnId } from "@/lib/employee-table-columns";
import { EmployeeSocialLinksCell } from "./employee-social-links-cell";
import { EmployeeRowActionsMenu } from "./employee-row-actions-menu";
import type { EmployeeListRow } from "./employee-list-row";

export type { EmployeeListRow };

function fmt(value: string | null | undefined): ReactNode {
  if (value == null || String(value).trim() === "") {
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  }
  return <span className="break-words">{value}</span>;
}

function profileImageCell(url: string | null | undefined): ReactNode {
  const u = url?.trim();
  if (!u) {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        —
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs; avoid next.config remotePatterns churn
    <img
      src={u}
      alt=""
      className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-600"
      loading="lazy"
    />
  );
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

function colWidthStyle(colId: EmployeeColumnId): CSSProperties | undefined {
  if (colId === "image") return { width: "3.5rem" };
  if (colId === "social") return { width: "4.5rem" };
  if (colId === "action") return { width: "3.25rem" };
  return undefined;
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
      cell: (row) => profileImageCell(row.profile_image),
      tdClass: "min-w-0 align-middle",
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
      tdClass: "min-w-0",
    },
    {
      id: "father_name",
      header: "FATHER NAME",
      cell: (row) => fmt(row.father_name),
      tdClass: "max-w-[9rem]",
    },
    {
      id: "dob",
      header: "DATE OF BIRTH",
      cell: (row) => (
        <span className="whitespace-nowrap">{fmt(row.dob)}</span>
      ),
    },
    {
      id: "cnic",
      header: "CNIC#",
      cell: (row) => (
        <span className="font-mono text-xs">{fmt(row.cnic_no)}</span>
      ),
      tdClass: "max-w-[9rem]",
    },
    {
      id: "ss_eubi",
      header: "SOCIAL SECURITY / EUBI",
      cell: (row) => fmt(row.ss_eubi_no),
      tdClass: "max-w-[8rem]",
    },
    {
      id: "phone",
      header: "PHONE NUMBER",
      cell: (row) => (
        <span className="whitespace-nowrap">{fmt(row.phone_no)}</span>
      ),
    },
    {
      id: "city",
      header: "CITY",
      cell: (row) => fmt(row.city),
      tdClass: "max-w-[8rem]",
    },
    {
      id: "department",
      header: "DEPARTMENT",
      cell: (row) => fmt(row.department),
      tdClass: "max-w-[8rem]",
    },
    {
      id: "section",
      header: "SECTION",
      cell: (row) => fmt(row.section),
      tdClass: "max-w-[8rem]",
    },
    {
      id: "education",
      header: "EDUCATION",
      cell: (row) => fmt(row.education),
      tdClass: "max-w-[12rem]",
    },
    {
      id: "address",
      header: "ADDRESS",
      cell: (row) => fmt(row.address),
      tdClass: "max-w-[14rem]",
    },
    {
      id: "experience",
      header: "EXPERIENCE",
      cell: (row) => fmt(row.experience),
      tdClass: "max-w-[12rem]",
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
      tdClass: "w-[4.5rem]",
    },
    {
      id: "email",
      header: "EMAIL ADDRESS",
      cell: (row) => (
        <span className="break-all">{fmt(row.email_address)}</span>
      ),
      tdClass: "max-w-[12rem]",
    },
    {
      id: "reference",
      header: "REFERENCE",
      cell: (row) => fmt(row.reference_info),
      tdClass: "max-w-[12rem]",
    },
    {
      id: "fam_father",
      header: "FATHER NAME",
      familyGroup: true,
      cell: (row) => fmt(row.family_father_name),
      tdClass: "max-w-[9rem]",
    },
    {
      id: "fam_cnic",
      header: "FATHER CNIC",
      familyGroup: true,
      cell: (row) => (
        <span className="font-mono text-xs">{fmt(row.family_cnic)}</span>
      ),
      tdClass: "max-w-[9rem]",
    },
    {
      id: "fam_phone",
      header: "PHONE (MAIN)",
      familyGroup: true,
      cell: (row) => (
        <span className="whitespace-nowrap">{fmt(row.family_phone)}</span>
      ),
    },
    {
      id: "fam_phone_alt",
      header: "PHONE (ALT)",
      familyGroup: true,
      cell: (row) => (
        <span className="whitespace-nowrap">{fmt(row.family_phone_alt)}</span>
      ),
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
}: {
  rows: EmployeeListRow[];
  visibility: Record<EmployeeColumnId, boolean>;
  onDelete: (id: string) => void | Promise<void>;
  onEmployeeNameClick?: (id: string) => void;
  /** Toggle between Active and Deactive (database constraint). */
  onToggleStatus?: (row: EmployeeListRow) => void | Promise<void>;
  /** When set, the status button for this row shows a spinner. */
  statusUpdatingId?: string | null;
}) {
  const defs = buildColumnDefs(
    onDelete,
    onEmployeeNameClick,
    onToggleStatus,
    statusUpdatingId,
  );
  const filtered = defs.filter((d) => visibility[d.id] === true);
  const visible =
    filtered.length > 0
      ? filtered
      : defs.filter((d) => d.id === "image" || d.id === "name");
  const firstFamilyIdx = visible.findIndex((d) => d.familyGroup);
  const colCount = Math.max(visible.length, 1);

  const thBase =
    "whitespace-nowrap px-4 py-3 align-middle text-[11px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400";
  const tdBase =
    "min-w-0 px-4 py-3 align-middle text-slate-800 dark:text-slate-200";

  return (
    <div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          {visible.map((col) => (
            <col key={col.id} style={colWidthStyle(col.id)} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80">
            {visible.map((col, i) => (
              <th
                key={col.id}
                scope="col"
                className={[
                  thBase,
                  col.thClass ?? "",
                  i === firstFamilyIdx && firstFamilyIdx >= 0
                    ? "border-l border-slate-200 dark:border-slate-700"
                    : "",
                ].join(" ")}
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
                className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
              >
                No employees yet. Add one from{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Add employee
                </span>
                .
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
                      col.tdClass ?? "",
                      i === firstFamilyIdx && firstFamilyIdx >= 0
                        ? "border-l border-slate-100 dark:border-slate-800"
                        : "",
                    ].join(" ")}
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
  );
}
