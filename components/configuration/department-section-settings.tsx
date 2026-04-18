"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Eye,
  Layers,
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
import { refreshConfigurationDirectorySnapshot } from "@/lib/actions/configuration-directory";
import {
  formatTitleForStorage,
  normalizeTitleKey as normalizeDirectoryTitleKey,
} from "@/lib/configuration/format-directory-title";
import { normalizeTitleKey } from "@/lib/normalize-title-key";
import { useUserAccess } from "@/components/dashboard/user-access-context";
import { EmployeeDetailModal } from "@/components/employees/employee-detail-modal";

export type DirectoryItem = {
  id: string;
  title: string;
  description: string;
};

export type SectionItem = DirectoryItem & {
  department_id: string;
};

function sortByTitle(a: DirectoryItem, b: DirectoryItem) {
  return a.title.localeCompare(b.title);
}

function departmentMatchesConfigScope(
  dept: DirectoryItem | null | undefined,
  scopeKey: string | null,
): boolean {
  if (!scopeKey) return true;
  if (!dept?.title) return false;
  return normalizeTitleKey(dept.title) === scopeKey;
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
    () => normalizeDirectoryTitleKey(formTitle),
    [formTitle],
  );

  const isDuplicateTitle = useMemo(() => {
    if (!titleKey) return false;
    return items.some((it) => {
      if (excludeId !== null && it.id === excludeId) return false;
      return normalizeDirectoryTitleKey(it.title) === titleKey;
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
  lockDepartmentManagement,
}: {
  departments: DirectoryItem[];
  sections: SectionItem[];
  deptCounts: Record<string, number>;
  secCounts: Record<string, number>;
  /** When true (manager with assigned department): hide add/edit/delete department; sections only. */
  lockDepartmentManagement?: boolean;
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
  const deptCrudLocked = Boolean(lockDepartmentManagement);
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

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  useEffect(() => {
    if (filteredDepartments.length === 0) {
      setSelectedDeptId(null);
      return;
    }
    setSelectedDeptId((prev) => {
      if (prev && filteredDepartments.some((d) => d.id === prev)) return prev;
      return filteredDepartments[0].id;
    });
  }, [filteredDepartments]);

  const selectedDept = useMemo(
    () => filteredDepartments.find((d) => d.id === selectedDeptId) ?? null,
    [filteredDepartments, selectedDeptId],
  );

  const selectedDeptSecList = selectedDept
    ? sectionsVisibleForDepartment(selectedDept)
    : [];

  const selectedDeptMeta = useMemo(() => {
    if (!selectedDept) return null;
    const dn = deptCounts[selectedDept.id] ?? 0;
    const deptDeleteBlocked = dn > 0;
    const childHasEmployees = sections
      .filter((s) => s.department_id === selectedDept.id)
      .some((s) => (secCounts[s.id] ?? 0) > 0);
    const canDeleteDept = !deptDeleteBlocked && !childHasEmployees;
    return { dn, deptDeleteBlocked, childHasEmployees, canDeleteDept };
  }, [selectedDept, deptCounts, sections, secCounts]);

  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/30 ring-1 ring-slate-900/[0.03] dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.45)] dark:ring-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100/80 bg-gradient-to-r from-violet-50/90 via-white to-fuchsia-50/70 px-4 py-4 sm:px-6 dark:border-violet-950/40 dark:from-violet-950/35 dark:via-slate-900 dark:to-fuchsia-950/25">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Departments &amp; sections
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {deptCrudLocked
              ? "Add or edit sections for your department only"
              : "Choose a department, then add or edit its sections"}
          </p>
        </div>
        {deptCrudLocked ? null : (
          <button
            type="button"
            onClick={() => setDeptAddOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-sm font-medium text-white shadow-md shadow-violet-500/25 transition hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg dark:shadow-violet-900/40"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Add department
          </button>
        )}
      </div>

      <div className="border-b border-slate-100 p-3 dark:border-slate-800 sm:px-6" role="search">
        <label htmlFor="search-departments-sections" className="sr-only">
          Search departments and sections
        </label>
        <div className="flex h-11 min-w-0 items-stretch overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-violet-200/40 transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-200/60 dark:border-slate-600 dark:bg-slate-800/80 dark:ring-violet-900/30 dark:focus-within:border-violet-500/60 dark:focus-within:ring-violet-600/25">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-violet-400 dark:text-violet-500/80"
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

      <div className="flex min-h-[min(28rem,70vh)] flex-col lg:min-h-[min(22rem,65vh)] lg:flex-row">
        <aside
          className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white dark:border-slate-800 dark:from-slate-950/80 dark:to-slate-900 lg:w-[min(100%,17.5rem)] lg:shrink-0 lg:border-b-0 lg:border-r"
          aria-label="Departments"
        >
          <div className="sticky top-0 max-h-[min(40vh,16rem)] overflow-y-auto p-3 sm:p-4 lg:max-h-none">
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-widest text-violet-600/90 dark:text-violet-400/90">
              <Building2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Departments
            </p>
            {departments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
                {deptCrudLocked ? (
                  <>
                    Your assigned department was not found in Configuration.
                    Ask an admin to check the department name or your access
                    settings.
                  </>
                ) : (
                  <>
                    No departments yet — use{" "}
                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                      Add department
                    </span>
                  </>
                )}
              </p>
            ) : filteredDepartments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/50 px-3 py-6 text-center text-sm text-amber-900/80 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100/90">
                No matches — try another search.
              </p>
            ) : (
              <ul className="flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
                {filteredDepartments.map((dept) => {
                  const isActive = dept.id === selectedDeptId;
                  return (
                    <li key={dept.id} className="shrink-0 lg:shrink">
                      <button
                        type="button"
                        onClick={() => setSelectedDeptId(dept.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={[
                          "flex w-full min-w-[10.5rem] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition lg:min-w-0",
                          isActive
                            ? "border-violet-300/90 bg-gradient-to-r from-violet-500/[0.12] to-fuchsia-500/[0.08] shadow-sm shadow-violet-500/10 dark:border-violet-500/40 dark:from-violet-500/20 dark:to-fuchsia-500/10 dark:shadow-violet-900/30"
                            : "border-transparent bg-white/70 hover:border-violet-200/80 hover:bg-violet-50/50 dark:bg-slate-900/40 dark:hover:border-violet-800/60 dark:hover:bg-violet-950/40",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                            isActive
                              ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                          ].join(" ")}
                        >
                          {dept.title.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">
                            {dept.title}
                          </span>
                        </span>
                        <ChevronRight
                          className={[
                            "h-4 w-4 shrink-0 text-violet-400 transition dark:text-violet-500/80",
                            isActive ? "opacity-100" : "opacity-40",
                          ].join(" ")}
                          strokeWidth={2}
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <div className="min-h-[12rem] flex-1 bg-gradient-to-br from-white via-violet-50/[0.35] to-fuchsia-50/30 p-4 sm:p-6 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20">
          {!selectedDept ? (
            <div className="flex h-full min-h-[14rem] flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200/60 bg-white/50 px-6 text-center dark:border-violet-900/40 dark:bg-slate-900/30">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl dark:from-violet-900/50 dark:to-fuchsia-900/40">
                <Layers className="h-7 w-7 text-violet-600 dark:text-violet-400" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Select a department
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-500">
                Sections for that department show up here — like a submenu.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {selectedDept && selectedDeptMeta ? (
                  <div className="rounded-3xl border border-violet-100/70 bg-white/90 p-4 shadow-sm dark:border-violet-900/35 dark:bg-slate-900/70 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800 dark:bg-violet-500/25 dark:text-violet-200">
                          Department
                        </span>
                        <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                          {selectedDept.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onShowDeptEmployees(selectedDept)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-violet-100 hover:text-violet-900 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-violet-950/60 dark:hover:text-violet-100"
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                          View employees ({selectedDeptMeta.dn})
                        </button>
                      </div>
                      <div className="flex shrink-0 gap-2 self-end sm:self-start">
                        {deptCrudLocked ? null : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setDeptEditState({
                                  id: selectedDept.id,
                                  item: selectedDept,
                                })
                              }
                              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-violet-700 dark:hover:bg-violet-950/50"
                            >
                              <Pencil
                                className="h-4 w-4"
                                strokeWidth={2}
                                aria-hidden
                              />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={!selectedDeptMeta.canDeleteDept}
                              title={
                                selectedDeptMeta.deptDeleteBlocked
                                  ? `${selectedDeptMeta.dn} employee(s) on this department`
                                  : selectedDeptMeta.childHasEmployees
                                    ? "A section still has employees"
                                    : "Delete department"
                              }
                              onClick={() => {
                                if (!selectedDeptMeta.canDeleteDept) return;
                                const ok = window.confirm(
                                  `Delete “${selectedDept.title}” and all its sections? This cannot be undone.`,
                                );
                                if (ok) void onDeleteDepartment(selectedDept.id);
                              }}
                              className={[
                                "inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition",
                                !selectedDeptMeta.canDeleteDept
                                  ? "cursor-not-allowed border border-slate-100 text-slate-300 opacity-60 dark:border-slate-800 dark:text-slate-600"
                                  : "border border-red-200/80 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70",
                              ].join(" ")}
                            >
                              <Trash2
                                className="h-4 w-4"
                                strokeWidth={2}
                                aria-hidden
                              />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
              ) : null}

              <div className="overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-50/40 via-white to-fuchsia-50/30 shadow-inner shadow-violet-100/50 dark:border-violet-900/40 dark:from-violet-950/30 dark:via-slate-900/90 dark:to-fuchsia-950/20 dark:shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet-100/60 px-4 py-3 dark:border-violet-900/40 sm:px-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md">
                      <Layers className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Sections
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Under this department
                      </p>
                    </div>
                    <span className="ml-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold tabular-nums text-violet-700 shadow-sm dark:bg-violet-950/80 dark:text-violet-200">
                      {selectedDeptSecList.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      selectedDept &&
                      setSectionForm({
                        mode: "add",
                        departmentId: selectedDept.id,
                      })
                    }
                    disabled={!selectedDept}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-200/80 transition hover:bg-violet-50 disabled:opacity-50 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800/60 dark:hover:bg-violet-900/60"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Add section
                  </button>
                </div>

                <div className="p-4 sm:p-5">
                  {selectedDeptSecList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-violet-200/70 bg-white/60 px-4 py-10 text-center dark:border-violet-900/50 dark:bg-slate-900/40">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        No sections yet — add one to get started
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          selectedDept &&
                          setSectionForm({
                            mode: "add",
                            departmentId: selectedDept.id,
                          })
                        }
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-95"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        Add first section
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {selectedDeptSecList.map((item) => {
                        const n = secCounts[item.id] ?? 0;
                        const deleteBlocked = n > 0;
                        return (
                          <li
                            key={item.id}
                            className="group flex flex-col gap-0 rounded-2xl border border-slate-100/90 bg-white/95 shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/60 dark:hover:border-violet-800/70 sm:flex-row sm:items-stretch"
                          >
                            <button
                              type="button"
                              onClick={() => onShowSecEmployees(item)}
                              className="min-w-0 flex-1 cursor-pointer rounded-2xl rounded-b-none border-0 bg-transparent p-3.5 text-left outline-none transition hover:bg-violet-50/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/80 dark:hover:bg-violet-950/25 dark:focus-visible:ring-violet-500/50 sm:rounded-l-2xl sm:rounded-r-none sm:py-3.5"
                              aria-label={`View employees in ${item.title}`}
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-50">
                                  {item.title}
                                </span>
                                <span className="ml-2 tabular-nums text-sm font-semibold text-violet-600 dark:text-violet-400">
                                  ({n})
                                </span>
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                                {item.description?.trim()
                                  ? item.description
                                  : "—"}
                              </p>
                            </button>
                            <div className="flex shrink-0 items-center gap-1 border-t border-slate-100 p-2 dark:border-slate-700 sm:flex-col sm:justify-center sm:border-l sm:border-t-0 sm:p-2">
                              <button
                                type="button"
                                disabled={deleteBlocked}
                                title={
                                  deleteBlocked
                                    ? `${n} employee(s) assigned`
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
                                  "rounded-xl p-2 transition",
                                  deleteBlocked
                                    ? "cursor-not-allowed text-slate-300 opacity-50 dark:text-slate-600"
                                    : "text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50",
                                ].join(" ")}
                                aria-label={`Delete ${item.title}`}
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSectionForm({
                                    mode: "edit",
                                    section: item,
                                  })
                                }
                                className="rounded-xl p-2 text-slate-500 transition hover:bg-violet-50 hover:text-violet-800 dark:hover:bg-violet-950/50 dark:hover:text-violet-200"
                                aria-label={`Edit ${item.title}`}
                              >
                                <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type DepartmentSectionSettingsProps = {
  /** When set, snapshot and UI are limited to this department title (manager scope). */
  configurationDepartmentScope?: string | null;
  initialSnapshot?: {
    departments: DirectoryItem[];
    sections: SectionItem[];
    deptCounts: Record<string, number>;
    secCounts: Record<string, number>;
    error: string | null;
  };
};

export function DepartmentSectionSettings({
  initialSnapshot,
  configurationDepartmentScope,
}: DepartmentSectionSettingsProps = {}) {
  const scopeKey = configurationDepartmentScope?.trim()
    ? normalizeTitleKey(configurationDepartmentScope.trim())
    : null;
  const [departments, setDepartments] = useState<DirectoryItem[]>(
    () => initialSnapshot?.departments ?? [],
  );
  const [sections, setSections] = useState<SectionItem[]>(
    () => initialSnapshot?.sections ?? [],
  );
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>(
    () => initialSnapshot?.deptCounts ?? {},
  );
  const [secCounts, setSecCounts] = useState<Record<string, number>>(
    () => initialSnapshot?.secCounts ?? {},
  );
  const [loading, setLoading] = useState(() => !initialSnapshot);
  const [loadError, setLoadError] = useState<string | null>(
    () => initialSnapshot?.error ?? null,
  );
  const [employeeListModal, setEmployeeListModal] = useState<{
    field: "department" | "section";
    item: DirectoryItem;
  } | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);
  const { canViewTimeline, canAddTimeline } = useUserAccess();

  const employeeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const loadDirectorySnapshot = useCallback(async () => {
    setLoadError(null);
    const result = await refreshConfigurationDirectorySnapshot();
    if (result.error) {
      setLoadError(result.error);
      return;
    }
    setDepartments(result.departments as DirectoryItem[]);
    setSections(result.sections as SectionItem[]);
    setDeptCounts(result.deptCounts);
    setSecCounts(result.secCounts);
  }, []);

  useEffect(() => {
    if (initialSnapshot) {
      setLoading(false);
      return;
    }
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
  }, [initialSnapshot, loadDirectorySnapshot]);

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
    if (scopeKey) {
      toast.error("Only an admin can add departments.");
      return;
    }
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
    const dept = departments.find((d) => d.id === departmentId);
    if (!departmentMatchesConfigScope(dept, scopeKey)) {
      toast.error("You can only add sections under your assigned department.");
      return;
    }
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
    const row = departments.find((d) => d.id === id);
    if (!departmentMatchesConfigScope(row, scopeKey)) {
      toast.error("You can only manage your assigned department.");
      return;
    }
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
    const secRow = sections.find((s) => s.id === id);
    const dept = secRow
      ? departments.find((d) => d.id === secRow.department_id)
      : undefined;
    if (!departmentMatchesConfigScope(dept, scopeKey)) {
      toast.error("You can only manage sections in your assigned department.");
      return;
    }
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
    if (!departmentMatchesConfigScope(row, scopeKey)) {
      toast.error("You can only manage your assigned department.");
      return;
    }
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
    const dept = departments.find((d) => d.id === row.department_id);
    if (!departmentMatchesConfigScope(dept, scopeKey)) {
      toast.error("You can only manage sections in your assigned department.");
      return;
    }
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
        showTimelineTab={canViewTimeline}
        canEditTimeline={canAddTimeline}
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
        lockDepartmentManagement={Boolean(scopeKey)}
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
