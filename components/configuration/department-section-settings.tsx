"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { EmployeeDetailModal } from "@/components/employees/employee-detail-modal";

export type DirectoryItem = {
  id: string;
  title: string;
  description: string;
};

export type SectionItem = DirectoryItem & {
  department_id: string;
};

/** Trim + collapse internal whitespace (so "  IT  " and "IT" match as duplicates). */
export function formatTitleForStorage(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

function normalizeTitleKey(raw: string): string {
  return formatTitleForStorage(raw).toLowerCase();
}

function sortByTitle(a: DirectoryItem, b: DirectoryItem) {
  return a.title.localeCompare(b.title);
}

/**
 * Values that might appear on `employees.department` / `employees.section` for this row
 * (combobox saves title; spacing/casing may differ from the directory row).
 */
function employeeFieldValuesMatchingRow(row: DirectoryItem): string[] {
  const raw = row.title ?? "";
  const formatted = formatTitleForStorage(raw);
  const trimmed = raw.trim();
  const base = [formatted, trimmed, raw].filter(
    (s) => typeof s === "string" && s.length > 0,
  );
  const out = new Set<string>();
  for (const s of base) {
    out.add(s);
    out.add(s.toLowerCase());
  }
  return [...out];
}

const MODAL_FIELD_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20";

type EmployeeMiniRow = {
  id: string;
  full_name: string | null;
  profile_image: string | null;
  phone_no: string | null;
  department: string | null;
  section: string | null;
};

function EmployeesInDirectoryModal({
  open,
  onClose,
  field,
  item,
  onViewEmployee,
}: {
  open: boolean;
  onClose: () => void;
  field: "department" | "section";
  item: DirectoryItem | null;
  onViewEmployee: (employeeId: string) => void;
}) {
  const titleId = useId();
  const [rows, setRows] = useState<EmployeeMiniRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !item) {
      setRows([]);
      setErr(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const candidates = employeeFieldValuesMatchingRow(item);
    if (candidates.length === 0) {
      setLoading(false);
      setRows([]);
      return;
    }
    const col = field === "department" ? "department" : "section";
    const supabase = createClient();
    const rowKey = formatTitleForStorage(item.title);

    void supabase
      .from("employees")
      .select(
        "id, full_name, profile_image, phone_no, department, section",
      )
      .in(col, candidates)
      .order("full_name")
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          setErr(error.message);
          setRows([]);
          return;
        }
        const list = (data ?? []) as EmployeeMiniRow[];
        const filtered = list.filter((r) => {
          const val = field === "department" ? r.department : r.section;
          return formatTitleForStorage(String(val ?? "")) === rowKey;
        });
        setRows(filtered);
      });

    return () => {
      cancelled = true;
    };
  }, [open, item, field]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const label = field === "department" ? "Department" : "Section";
  const displayTitle = formatTitleForStorage(item.title);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] dark:bg-black/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(85vh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {label}: {displayTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : err ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {err}
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No employees in this {label.toLowerCase()}.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((emp) => (
                <li key={emp.id}>
                  <div className="flex items-center gap-3 py-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600">
                      {emp.profile_image?.trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Supabase public URL
                        <img
                          src={emp.profile_image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                          <User className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {emp.full_name?.trim() || "—"}
                      </p>
                      {emp.phone_no?.trim() ? (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {emp.phone_no}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewEmployee(emp.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemFormModal({
  open,
  mode,
  panelLabel,
  titleId,
  initialItem,
  items,
  excludeId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  panelLabel: string;
  titleId: string;
  initialItem: DirectoryItem | null;
  items: DirectoryItem[];
  excludeId: string | null;
  onClose: () => void;
  onSubmit: (item: { title: string; description: string }) => void | Promise<void>;
}) {
  const baseId = useId();
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setFormTitle("");
    setFormDescription("");
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (mode === "edit" && initialItem) {
      setFormTitle(initialItem.title);
      setFormDescription(initialItem.description);
    } else {
      reset();
    }
  }, [open, mode, initialItem, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  const titleKey = useMemo(
    () => normalizeTitleKey(formTitle),
    [formTitle],
  );

  const isDuplicateTitle = useMemo(() => {
    if (!titleKey) return false;
    return items.some((it) => {
      if (excludeId !== null && it.id === excludeId) return false;
      return normalizeTitleKey(it.title) === titleKey;
    });
  }, [items, titleKey, excludeId]);

  const titleStored = useMemo(
    () => formatTitleForStorage(formTitle),
    [formTitle],
  );

  const canSubmit =
    titleStored.length > 0 && !isDuplicateTitle && !saving;

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await Promise.resolve(
        onSubmit({
          title: titleStored,
          description: formDescription.trim(),
        }),
      );
      reset();
      onClose();
    } catch {
      // toast shown in parent
    } finally {
      setSaving(false);
    }
  }

  const heading = mode === "edit" ? `Edit ${panelLabel}` : `Add ${panelLabel}`;
  const isEdit = mode === "edit";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        disabled={saving}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] disabled:cursor-not-allowed dark:bg-black/70"
        onClick={() => !saving && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h3 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {heading}
          </h3>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor={`${baseId}-title`}
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Title
            </label>
            <input
              id={`${baseId}-title`}
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              autoFocus={!isEdit}
              disabled={saving}
              placeholder="e.g. Marketing"
              aria-invalid={isDuplicateTitle}
              aria-describedby={
                isDuplicateTitle ? `${baseId}-dup` : undefined
              }
              className={[
                MODAL_FIELD_CLASS,
                isDuplicateTitle
                  ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500/25 dark:border-amber-500 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
                  : "",
              ].join(" ")}
            />
            {isDuplicateTitle ? (
              <p
                id={`${baseId}-dup`}
                role="alert"
                className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>
                  This title already exists. Use a different name (leading,
                  trailing, or extra spaces between words are treated as the same
                  title).
                </span>
              </p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor={`${baseId}-description`}
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id={`${baseId}-description`}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              disabled={saving}
              placeholder="Optional details"
              className={`${MODAL_FIELD_CLASS} resize-y`}
            />
          </div>
          <div className="mt-1 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : isEdit ? (
                <>
                  <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Save
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Add
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DepartmentsWithNestedSections({
  departments,
  sections,
  deptCounts,
  secCounts,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onShowDeptEmployees,
  onShowSecEmployees,
}: {
  departments: DirectoryItem[];
  sections: SectionItem[];
  deptCounts: Record<string, number>;
  secCounts: Record<string, number>;
  onAddDepartment: (item: {
    title: string;
    description: string;
  }) => void | Promise<void>;
  onUpdateDepartment: (
    id: string,
    item: { title: string; description: string },
  ) => void | Promise<void>;
  onDeleteDepartment: (id: string) => void | Promise<void>;
  onAddSection: (
    departmentId: string,
    item: { title: string; description: string },
  ) => void | Promise<void>;
  onUpdateSection: (
    id: string,
    item: { title: string; description: string },
  ) => void | Promise<void>;
  onDeleteSection: (id: string) => void | Promise<void>;
  onShowDeptEmployees: (item: DirectoryItem) => void;
  onShowSecEmployees: (item: DirectoryItem) => void;
}) {
  const [deptAddOpen, setDeptAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptEditState, setDeptEditState] = useState<{
    id: string;
    item: DirectoryItem;
  } | null>(null);
  const [sectionForm, setSectionForm] = useState<
    | { mode: "add"; departmentId: string }
    | { mode: "edit"; section: SectionItem }
    | null
  >(null);

  const deptAddModalTitleId = useId();
  const deptEditTitleId = useId();
  const sectionModalTitleId = useId();

  const qLower = searchQuery.trim().toLowerCase();

  const filteredDepartments = useMemo(() => {
    if (!qLower) return departments;
    return departments.filter((d) => {
      const t = d.title.toLowerCase();
      const desc = (d.description ?? "").toLowerCase();
      if (t.includes(qLower) || desc.includes(qLower)) return true;
      return sections.some((s) => {
        if (s.department_id !== d.id) return false;
        const st = s.title.toLowerCase();
        const sd = (s.description ?? "").toLowerCase();
        return st.includes(qLower) || sd.includes(qLower);
      });
    });
  }, [departments, sections, qLower]);

  function sectionsVisibleForDepartment(dept: DirectoryItem): SectionItem[] {
    const list = sections
      .filter((s) => s.department_id === dept.id)
      .slice()
      .sort(sortByTitle);
    if (!qLower) return list;
    const deptMatches =
      dept.title.toLowerCase().includes(qLower) ||
      (dept.description ?? "").toLowerCase().includes(qLower);
    if (deptMatches) return list;
    return list.filter((s) => {
      const st = s.title.toLowerCase();
      const sd = (s.description ?? "").toLowerCase();
      return st.includes(qLower) || sd.includes(qLower);
    });
  }

  const sectionModalItems = useMemo(() => {
    if (sectionForm === null) return [];
    const deptId =
      sectionForm.mode === "add"
        ? sectionForm.departmentId
        : sectionForm.section.department_id;
    return sections.filter((s) => s.department_id === deptId);
  }, [sectionForm, sections]);

  const sectionModalExcludeId =
    sectionForm?.mode === "edit" ? sectionForm.section.id : null;

  const sectionPanelLabel =
    sectionForm === null
      ? "Section"
      : sectionForm.mode === "add"
        ? `Section — ${
            departments.find((d) => d.id === sectionForm.departmentId)
              ?.title ?? "Department"
          }`
        : `Section — ${
            departments.find((d) => d.id === sectionForm.section.department_id)
              ?.title ?? "Department"
          }`;

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Departments &amp; sections
        </h2>
        <button
          type="button"
          onClick={() => setDeptAddOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Add department
        </button>
      </div>

      <div className="border-b border-slate-100 p-3 dark:border-slate-800" role="search">
        <label htmlFor="search-departments-sections" className="sr-only">
          Search departments and sections
        </label>
        <div className="flex h-11 min-w-0 items-stretch overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-slate-200/60 transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200/70 dark:border-slate-600 dark:bg-slate-800/80 dark:ring-slate-700/40 dark:focus-within:border-slate-500 dark:focus-within:ring-slate-600/35">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
              strokeWidth={2}
              aria-hidden
            />
            <input
              id="search-departments-sections"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search departments or sections…"
              autoComplete="off"
              className="h-full min-w-0 flex-1 border-0 bg-transparent py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <ItemFormModal
        open={deptAddOpen}
        mode="add"
        panelLabel="Department"
        titleId={deptAddModalTitleId}
        initialItem={null}
        items={departments}
        excludeId={null}
        onClose={() => setDeptAddOpen(false)}
        onSubmit={onAddDepartment}
      />

      <ItemFormModal
        open={deptEditState !== null}
        mode="edit"
        panelLabel="Department"
        titleId={deptEditTitleId}
        initialItem={deptEditState?.item ?? null}
        items={departments}
        excludeId={deptEditState?.id ?? null}
        onClose={() => setDeptEditState(null)}
        onSubmit={async (item) => {
          if (deptEditState === null) return;
          await onUpdateDepartment(deptEditState.id, item);
        }}
      />

      <ItemFormModal
        open={sectionForm !== null}
        mode={sectionForm?.mode === "edit" ? "edit" : "add"}
        panelLabel={sectionPanelLabel}
        titleId={sectionModalTitleId}
        initialItem={
          sectionForm?.mode === "edit" ? sectionForm.section : null
        }
        items={sectionModalItems}
        excludeId={sectionModalExcludeId}
        onClose={() => setSectionForm(null)}
        onSubmit={async (item) => {
          if (sectionForm === null) return;
          if (sectionForm.mode === "add") {
            await onAddSection(sectionForm.departmentId, item);
          } else {
            await onUpdateSection(sectionForm.section.id, item);
          }
        }}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[min(100%,28rem)] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80">
              <th
                scope="col"
                className="whitespace-nowrap px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
              >
                Department
              </th>
              <th
                scope="col"
                className="min-w-[6rem] px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
              >
                Description
              </th>
              <th
                scope="col"
                className="w-[1%] whitespace-nowrap px-3 py-2.5 text-right text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                >
                  No departments yet — click Add department to create one.
                </td>
              </tr>
            ) : filteredDepartments.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                >
                  No matches for your search.
                </td>
              </tr>
            ) : (
              filteredDepartments.map((dept) => {
                const dn = deptCounts[dept.id] ?? 0;
                const deptDeleteBlocked = dn > 0;
                const secList = sectionsVisibleForDepartment(dept);
                return (
                  <Fragment key={dept.id}>
                    <tr
                      className="border-b border-slate-50 text-sm font-semibold dark:border-slate-800/80"
                    >
                      <td className="max-w-[min(16rem,50vw)] px-3 py-2 align-middle">
                        <button
                          type="button"
                          onClick={() => onShowDeptEmployees(dept)}
                          className="group inline-flex max-w-full flex-wrap items-baseline gap-x-1 text-left text-sm transition"
                          title="View employees assigned to this department"
                        >
                          <span className="font-bold text-slate-900 underline-offset-2 group-hover:underline dark:text-slate-100">
                            {dept.title}
                          </span>
                          <span className="font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                            ({dn})
                          </span>
                        </button>
                      </td>
                      <td className="max-w-[min(14rem,35vw)] px-3 py-2 align-middle font-medium text-slate-700 dark:text-slate-300">
                        {dept.description ? (
                          <span className="line-clamp-2 font-semibold">
                            {dept.description}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400 dark:text-slate-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right align-middle">
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            disabled={deptDeleteBlocked}
                            title={
                              deptDeleteBlocked
                                ? `${dn} employee(s) assigned — remove assignments first`
                                : "Delete"
                            }
                            onClick={() => {
                              if (deptDeleteBlocked) return;
                              const ok = window.confirm(
                                `Delete “${dept.title}” and all its sections? This cannot be undone.`,
                              );
                              if (ok) void onDeleteDepartment(dept.id);
                            }}
                            className={[
                              "rounded-md p-1.5 transition",
                              deptDeleteBlocked
                                ? "cursor-not-allowed text-slate-300 opacity-50 dark:text-slate-600"
                                : "text-slate-600 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400",
                            ].join(" ")}
                            aria-label={`Delete ${dept.title}`}
                            aria-disabled={deptDeleteBlocked}
                          >
                            <Trash2
                              className="h-4 w-4"
                              strokeWidth={2}
                              aria-hidden
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeptEditState({ id: dept.id, item: dept })
                            }
                            className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            aria-label={`Edit ${dept.title}`}
                            title="Edit"
                          >
                            <Pencil
                              className="h-4 w-4"
                              strokeWidth={2}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td colSpan={3} className="bg-slate-50/50 px-0 py-0 dark:bg-slate-950/40">
                        <div className="border-l-2 border-slate-200 px-3 py-3 pl-5 dark:border-slate-600">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Sections
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setSectionForm({
                                  mode: "add",
                                  departmentId: dept.id,
                                })
                              }
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                              Add section
                            </button>
                          </div>
                          {secList.length === 0 ? (
                            <p className="py-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                              No sections for this department yet.
                            </p>
                          ) : (
                            <table className="w-full border-collapse text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-200/90 dark:border-slate-700">
                                  <th className="py-1.5 pr-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Name
                                  </th>
                                  <th className="py-1.5 pr-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Description
                                  </th>
                                  <th className="w-[1%] py-1.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {secList.map((item) => {
                                  const n = secCounts[item.id] ?? 0;
                                  const deleteBlocked = n > 0;
                                  return (
                                    <tr
                                      key={item.id}
                                      className="border-b border-slate-100/90 last:border-0 dark:border-slate-800/80"
                                    >
                                      <td className="max-w-[min(14rem,45vw)] py-2 pr-2 align-middle">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onShowSecEmployees(item)
                                          }
                                          className="group inline-flex max-w-full flex-wrap items-baseline gap-x-1 text-left text-sm transition"
                                          title="View employees assigned to this section"
                                        >
                                          <span className="font-bold text-slate-800 underline-offset-2 group-hover:underline dark:text-slate-100">
                                            {item.title}
                                          </span>
                                          <span className="font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                                            ({n})
                                          </span>
                                        </button>
                                      </td>
                                      <td className="max-w-[min(12rem,35vw)] py-2 pr-2 align-middle text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {item.description ? (
                                          <span className="line-clamp-2 font-semibold">
                                            {item.description}
                                          </span>
                                        ) : (
                                          <span className="font-semibold text-slate-400 dark:text-slate-500">
                                            —
                                          </span>
                                        )}
                                      </td>
                                      <td className="whitespace-nowrap py-2 text-right align-middle">
                                        <div className="inline-flex items-center justify-end gap-0.5">
                                          <button
                                            type="button"
                                            disabled={deleteBlocked}
                                            title={
                                              deleteBlocked
                                                ? `${n} employee(s) assigned — remove assignments first`
                                                : "Delete"
                                            }
                                            onClick={() => {
                                              if (deleteBlocked) return;
                                              const ok = window.confirm(
                                                `Delete “${item.title}”? This cannot be undone.`,
                                              );
                                              if (ok) void onDeleteSection(item.id);
                                            }}
                                            className={[
                                              "rounded-md p-1.5 transition",
                                              deleteBlocked
                                                ? "cursor-not-allowed text-slate-300 opacity-50 dark:text-slate-600"
                                                : "text-slate-600 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400",
                                            ].join(" ")}
                                            aria-label={`Delete ${item.title}`}
                                            aria-disabled={deleteBlocked}
                                          >
                                            <Trash2
                                              className="h-4 w-4"
                                              strokeWidth={2}
                                              aria-hidden
                                            />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setSectionForm({
                                                mode: "edit",
                                                section: item,
                                              })
                                            }
                                            className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                            aria-label={`Edit ${item.title}`}
                                            title="Edit"
                                          >
                                            <Pencil
                                              className="h-4 w-4"
                                              strokeWidth={2}
                                              aria-hidden
                                            />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type DeptCountRow = { dept_id: string; employee_count: number | string };
type SecCountRow = { section_id: string; employee_count: number | string };

function mapCount<T extends Record<string, unknown>>(
  rows: T[] | null,
  idKey: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows ?? []) {
    const id = r[idKey];
    const c = r.employee_count;
    if (typeof id === "string") {
      const n = typeof c === "number" ? c : Number(c);
      out[id] = Number.isFinite(n) ? n : 0;
    }
  }
  return out;
}

function buildFallbackCounts(
  deptRows: DirectoryItem[],
  secRows: SectionItem[],
  emps: { department: string | null; section: string | null }[],
): { dept: Record<string, number>; sec: Record<string, number> } {
  const deptOut: Record<string, number> = {};
  const secOut: Record<string, number> = {};
  for (const row of deptRows) {
    const key = formatTitleForStorage(row.title);
    deptOut[row.id] = emps.filter(
      (e) =>
        e.department != null &&
        formatTitleForStorage(e.department) === key,
    ).length;
  }
  for (const row of secRows) {
    const key = formatTitleForStorage(row.title);
    secOut[row.id] = emps.filter(
      (e) =>
        e.section != null && formatTitleForStorage(e.section) === key,
    ).length;
  }
  return { dept: deptOut, sec: secOut };
}

export function DepartmentSectionSettings() {
  const [departments, setDepartments] = useState<DirectoryItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
  const [secCounts, setSecCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employeeListModal, setEmployeeListModal] = useState<{
    field: "department" | "section";
    item: DirectoryItem;
  } | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  const employeeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const loadDirectorySnapshot = useCallback(async () => {
    const supabase = createClient();
    setLoadError(null);

    const [dRes, sRes] = await Promise.all([
      supabase.from("departments").select("*").order("title"),
      supabase.from("sections").select("*").order("title"),
    ]);

    if (dRes.error) {
      setLoadError(dRes.error.message);
      return;
    }
    if (sRes.error) {
      setLoadError(sRes.error.message);
      return;
    }

    const deptRows = ((dRes.data as DirectoryItem[]) ?? [])
      .slice()
      .sort(sortByTitle);
    const secRows = ((sRes.data as SectionItem[]) ?? [])
      .slice()
      .sort(sortByTitle);
    setDepartments(deptRows);
    setSections(secRows);

    const [dcRes, scRes] = await Promise.all([
      supabase.rpc("department_employee_counts"),
      supabase.rpc("section_employee_counts"),
    ]);

    if (!dcRes.error && dcRes.data != null && !scRes.error && scRes.data != null) {
      setDeptCounts(mapCount(dcRes.data as DeptCountRow[], "dept_id"));
      setSecCounts(mapCount(scRes.data as SecCountRow[], "section_id"));
      return;
    }

    const { data: emps, error: empErr } = await supabase
      .from("employees")
      .select("department, section");
    if (empErr) {
      setDeptCounts({});
      setSecCounts({});
      return;
    }
    const list = (emps ?? []) as {
      department: string | null;
      section: string | null;
    }[];
    const { dept, sec } = buildFallbackCounts(deptRows, secRows, list);
    setDeptCounts(dept);
    setSecCounts(sec);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      setLoadError(null);
      await loadDirectorySnapshot();
      if (!cancelled) setLoading(false);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadDirectorySnapshot]);

  const scheduleEmployeeRefresh = useCallback(() => {
    if (employeeDebounceRef.current) {
      clearTimeout(employeeDebounceRef.current);
    }
    employeeDebounceRef.current = setTimeout(() => {
      employeeDebounceRef.current = null;
      void loadDirectorySnapshot();
    }, 400);
  }, [loadDirectorySnapshot]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("configuration-directory")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "departments" },
        () => {
          void loadDirectorySnapshot();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sections" },
        () => {
          void loadDirectorySnapshot();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => {
          scheduleEmployeeRefresh();
        },
      )
      .subscribe();

    return () => {
      if (employeeDebounceRef.current) {
        clearTimeout(employeeDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [loadDirectorySnapshot, scheduleEmployeeRefresh]);

  async function addDepartment(item: { title: string; description: string }) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("departments")
      .insert({
        title: item.title,
        description: item.description,
      })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        toast.error("Duplicate title", {
          description:
            "This title already exists (including when only spaces differ).",
        });
      } else {
        toast.error("Could not add department", { description: error.message });
      }
      throw error;
    }
    setDepartments((prev) =>
      [...prev, data as DirectoryItem].sort(sortByTitle),
    );
    void loadDirectorySnapshot();
  }

  async function addSection(
    departmentId: string,
    item: { title: string; description: string },
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sections")
      .insert({
        department_id: departmentId,
        title: item.title,
        description: item.description,
      })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        toast.error("Duplicate title", {
          description:
            "This title already exists (including when only spaces differ).",
        });
      } else {
        toast.error("Could not add section", { description: error.message });
      }
      throw error;
    }
    setSections((prev) =>
      [...prev, data as SectionItem].sort(sortByTitle),
    );
    void loadDirectorySnapshot();
  }

  async function updateDepartment(
    id: string,
    item: { title: string; description: string },
  ) {
    const supabase = createClient();
    const { data: employeesUpdated, error } = await supabase.rpc(
      "apply_department_update_sync_employees",
      {
        p_id: id,
        p_new_title: item.title,
        p_new_description: item.description,
      },
    );
    if (error) {
      if (error.code === "23505") {
        toast.error("Duplicate title", {
          description:
            "This title already exists (including when only spaces differ).",
        });
      } else {
        toast.error("Could not update department", {
          description: error.message,
        });
      }
      throw error;
    }
    const n =
      typeof employeesUpdated === "number" ? employeesUpdated : Number(employeesUpdated ?? 0);
    toast.success("Department saved", {
      description:
        n > 0
          ? `Updated ${n} employee record(s) to use the new department name.`
          : undefined,
    });
    setDepartments((prev) =>
      prev
        .map((row) =>
          row.id === id
            ? { ...row, title: item.title, description: item.description }
            : row,
        )
        .sort(sortByTitle),
    );
    void loadDirectorySnapshot();
  }

  async function updateSection(
    id: string,
    item: { title: string; description: string },
  ) {
    const supabase = createClient();
    const { data: employeesUpdated, error } = await supabase.rpc(
      "apply_section_update_sync_employees",
      {
        p_id: id,
        p_new_title: item.title,
        p_new_description: item.description,
      },
    );
    if (error) {
      if (error.code === "23505") {
        toast.error("Duplicate title", {
          description:
            "This title already exists (including when only spaces differ).",
        });
      } else {
        toast.error("Could not update section", { description: error.message });
      }
      throw error;
    }
    const n =
      typeof employeesUpdated === "number" ? employeesUpdated : Number(employeesUpdated ?? 0);
    toast.success("Section saved", {
      description:
        n > 0
          ? `Updated ${n} employee record(s) to use the new section name.`
          : undefined,
    });
    setSections((prev) =>
      prev
        .map((row) =>
          row.id === id
            ? {
                ...row,
                title: item.title,
                description: item.description,
              }
            : row,
        )
        .sort(sortByTitle),
    );
    void loadDirectorySnapshot();
  }

  async function deleteDepartment(id: string) {
    const row = departments.find((d) => d.id === id);
    if (!row) return;
    const n = deptCounts[row.id] ?? 0;
    if (n > 0) {
      toast.error(
        `Cannot delete. This department is currently assigned to ${n} employees.`,
      );
      return;
    }
    const childSections = sections.filter((s) => s.department_id === id);
    for (const s of childSections) {
      const sn = secCounts[s.id] ?? 0;
      if (sn > 0) {
        toast.error(
          `Cannot delete. A section under this department (“${s.title}”) is assigned to ${sn} employee(s).`,
        );
        return;
      }
    }

    const supabase = createClient();
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete department", { description: error.message });
      throw error;
    }
    setDepartments((prev) => prev.filter((r) => r.id !== id));
    void loadDirectorySnapshot();
  }

  async function deleteSection(id: string) {
    const row = sections.find((s) => s.id === id);
    if (!row) return;
    const n = secCounts[row.id] ?? 0;
    if (n > 0) {
      toast.error(
        `Cannot delete. This section is currently assigned to ${n} employees.`,
      );
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete section", { description: error.message });
      throw error;
    }
    setSections((prev) => prev.filter((r) => r.id !== id));
    void loadDirectorySnapshot();
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Loading configuration…
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        role="alert"
      >
        <p className="font-medium">Could not load departments and sections</p>
        <p className="mt-1 opacity-90">{loadError}</p>
        <p className="mt-2 text-xs opacity-80">
          Run the SQL migration in Supabase (see{" "}
          <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900/50">
            supabase/migrations/
          </code>
          ) and ensure{" "}
          <code className="rounded bg-red-100 px-1 py-0.5 dark:bg-red-900/50">
            .env.local
          </code>{" "}
          has your project URL and anon key.
        </p>
      </div>
    );
  }

  return (
    <>
      <EmployeeDetailModal
        employeeId={detailEmployeeId}
        onClose={() => setDetailEmployeeId(null)}
      />
      <EmployeesInDirectoryModal
        open={employeeListModal !== null}
        onClose={() => setEmployeeListModal(null)}
        field={employeeListModal?.field ?? "department"}
        item={employeeListModal?.item ?? null}
        onViewEmployee={(id) => setDetailEmployeeId(id)}
      />
      <DepartmentsWithNestedSections
        departments={departments}
        sections={sections}
        deptCounts={deptCounts}
        secCounts={secCounts}
        onAddDepartment={addDepartment}
        onUpdateDepartment={updateDepartment}
        onDeleteDepartment={deleteDepartment}
        onAddSection={addSection}
        onUpdateSection={updateSection}
        onDeleteSection={deleteSection}
        onShowDeptEmployees={(item) =>
          setEmployeeListModal({ field: "department", item })
        }
        onShowSecEmployees={(item) =>
          setEmployeeListModal({ field: "section", item })
        }
      />
    </>
  );
}
