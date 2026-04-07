"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Pencil,
  Plus,
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

/** How many employees use this department/section (normalized title match). */
function countEmployeesForDirectoryRow(
  row: DirectoryItem,
  employeeValues: string[],
): number {
  const rowKey = formatTitleForStorage(row.title);
  if (!rowKey) return 0;
  return employeeValues.reduce(
    (acc, v) => acc + (formatTitleForStorage(v) === rowKey ? 1 : 0),
    0,
  );
}

function isDirectoryRowUsedByEmployees(
  row: DirectoryItem,
  employeeValues: string[],
): boolean {
  return countEmployeesForDirectoryRow(row, employeeValues) > 0;
}

/** e.g. 5 → "(05)", 42 → "(42)", 150 → "(150)" */
function formatEmployeeCountLabel(count: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const inner = n < 100 ? String(n).padStart(2, "0") : String(n);
  return `(${inner})`;
}

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
  /** Row id to skip when checking duplicates (current row in edit mode). */
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
                "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-60 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500",
                isDuplicateTitle
                  ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500/25 dark:border-amber-500 dark:focus:border-amber-500 dark:focus:ring-amber-500/20"
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-900/10 dark:border-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-400/20",
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
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20"
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

function DirectoryPanel({
  title,
  items,
  onAdd,
  onUpdate,
  onDelete,
  isDeleteDisabled,
  employeeCount,
  onShowEmployees,
}: {
  title: string;
  items: DirectoryItem[];
  onAdd: (item: { title: string; description: string }) => void | Promise<void>;
  onUpdate: (
    id: string,
    item: { title: string; description: string },
  ) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  /** When true, delete control is disabled (e.g. row still referenced by employees). */
  isDeleteDisabled?: (item: DirectoryItem) => boolean;
  /** Employees assigned to this row (for title suffix like "Studio (05)"). */
  employeeCount: (item: DirectoryItem) => number;
  /** Opens popup listing employees for this department or section. */
  onShowEmployees: (item: DirectoryItem) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editState, setEditState] = useState<{
    id: string;
    item: DirectoryItem;
  } | null>(null);
  const addTitleId = useId();
  const editTitleId = useId();

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
      <div className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Add
        </button>
      </div>

      <ItemFormModal
        open={addOpen}
        mode="add"
        panelLabel={title}
        titleId={addTitleId}
        initialItem={null}
        items={items}
        excludeId={null}
        onClose={() => setAddOpen(false)}
        onSubmit={onAdd}
      />

      <ItemFormModal
        open={editState !== null}
        mode="edit"
        panelLabel={title}
        titleId={editTitleId}
        initialItem={editState?.item ?? null}
        items={items}
        excludeId={editState?.id ?? null}
        onClose={() => setEditState(null)}
        onSubmit={async (item) => {
          if (editState === null) return;
          await onUpdate(editState.id, item);
        }}
      />

      <div className="overflow-x-auto px-1 pb-1">
        <table className="w-full min-w-[320px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th
                scope="col"
                className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Description
              </th>
              <th
                scope="col"
                className="w-[1%] whitespace-nowrap px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  No items yet. Use Add to create one.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-50 last:border-0 dark:border-slate-800/80"
                >
                  <td className="px-6 py-3 text-slate-800 dark:text-slate-200">
                    <button
                      type="button"
                      onClick={() => onShowEmployees(item)}
                      className="group inline-flex max-w-full flex-wrap items-baseline gap-x-0 text-left transition"
                    >
                      <span className="font-medium text-slate-800 underline-offset-2 group-hover:underline dark:text-slate-200">
                        {item.title}
                      </span>
                      <span
                        className="ml-1.5 font-normal tabular-nums text-slate-500 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300"
                        title="Click to see employees"
                      >
                        {formatEmployeeCountLabel(employeeCount(item))}
                      </span>
                    </button>
                  </td>
                  <td className="max-w-[min(12rem,40vw)] px-6 py-3 text-slate-600 dark:text-slate-400">
                    {item.description ? (
                      <span className="line-clamp-2">{item.description}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-2 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditState({ id: item.id, item })
                        }
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        disabled={isDeleteDisabled?.(item) === true}
                        title={
                          isDeleteDisabled?.(item)
                            ? "In use by at least one employee — cannot delete"
                            : undefined
                        }
                        onClick={() => {
                          if (isDeleteDisabled?.(item)) return;
                          const ok = window.confirm(
                            `Delete “${item.title}”? This cannot be undone.`,
                          );
                          if (ok) void onDelete(item.id);
                        }}
                        className={[
                          "rounded-lg p-2 transition",
                          isDeleteDisabled?.(item)
                            ? "cursor-not-allowed text-slate-300 opacity-50 dark:text-slate-600"
                            : "text-slate-600 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400",
                        ].join(" ")}
                        aria-label={`Delete ${item.title}`}
                        aria-disabled={isDeleteDisabled?.(item) === true}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DepartmentSectionSettings() {
  const [departments, setDepartments] = useState<DirectoryItem[]>([]);
  const [sections, setSections] = useState<DirectoryItem[]>([]);
  const [employeeDepartmentValues, setEmployeeDepartmentValues] = useState<
    string[]
  >([]);
  const [employeeSectionValues, setEmployeeSectionValues] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [employeeListModal, setEmployeeListModal] = useState<{
    field: "department" | "section";
    item: DirectoryItem;
  } | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);

  const refreshEmployeeUsage = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("employees")
      .select("department, section");
    const dept: string[] = [];
    const sec: string[] = [];
    for (const r of data ?? []) {
      if (
        typeof r.department === "string" &&
        r.department.trim() !== ""
      ) {
        dept.push(r.department);
      }
      if (typeof r.section === "string" && r.section.trim() !== "") {
        sec.push(r.section);
      }
    }
    setEmployeeDepartmentValues(dept);
    setEmployeeSectionValues(sec);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      setLoading(true);
      setLoadError(null);
      const [dRes, sRes] = await Promise.all([
        supabase.from("departments").select("*").order("title"),
        supabase.from("sections").select("*").order("title"),
      ]);
      if (cancelled) return;
      if (dRes.error) {
        setLoadError(dRes.error.message);
        setLoading(false);
        return;
      }
      if (sRes.error) {
        setLoadError(sRes.error.message);
        setLoading(false);
        return;
      }
      setDepartments((dRes.data as DirectoryItem[]) ?? []);
      setSections((sRes.data as DirectoryItem[]) ?? []);
      await refreshEmployeeUsage();
      if (cancelled) return;
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshEmployeeUsage]);

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
    setDepartments((prev) => [...prev, data as DirectoryItem].sort(sortByTitle));
  }

  async function addSection(item: { title: string; description: string }) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sections")
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
        toast.error("Could not add section", { description: error.message });
      }
      throw error;
    }
    setSections((prev) => [...prev, data as DirectoryItem].sort(sortByTitle));
  }

  async function updateDepartment(
    id: string,
    item: { title: string; description: string },
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("departments")
      .update({
        title: item.title,
        description: item.description,
      })
      .eq("id", id)
      .select()
      .single();
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
    setDepartments((prev) =>
      prev
        .map((row) => (row.id === id ? (data as DirectoryItem) : row))
        .sort(sortByTitle),
    );
    void refreshEmployeeUsage();
  }

  async function updateSection(
    id: string,
    item: { title: string; description: string },
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sections")
      .update({
        title: item.title,
        description: item.description,
      })
      .eq("id", id)
      .select()
      .single();
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
    setSections((prev) =>
      prev
        .map((row) => (row.id === id ? (data as DirectoryItem) : row))
        .sort(sortByTitle),
    );
    void refreshEmployeeUsage();
  }

  async function deleteDepartment(id: string) {
    const row = departments.find((d) => d.id === id);
    if (!row) return;

    const candidates = employeeFieldValuesMatchingRow(row);
    if (candidates.length === 0) {
      toast.error("Could not delete department", {
        description: "Invalid department title.",
      });
      return;
    }

    const supabase = createClient();
    const { data: inUseRows, error: useError } = await supabase
      .from("employees")
      .select("id")
      .in("department", candidates)
      .limit(1);

    if (useError) {
      toast.error("Could not verify usage", { description: useError.message });
      return;
    }
    if (inUseRows && inUseRows.length > 0) {
      const label = formatTitleForStorage(row.title);
      toast.error("Cannot delete department", {
        description: `At least one employee still has department “${label}”. Update those employees first, then try again.`,
      });
      return;
    }

    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete department", { description: error.message });
      throw error;
    }
    setDepartments((prev) => prev.filter((r) => r.id !== id));
    void refreshEmployeeUsage();
  }

  async function deleteSection(id: string) {
    const row = sections.find((s) => s.id === id);
    if (!row) return;

    const candidates = employeeFieldValuesMatchingRow(row);
    if (candidates.length === 0) {
      toast.error("Could not delete section", {
        description: "Invalid section title.",
      });
      return;
    }

    const supabase = createClient();
    const { data: inUseRows, error: useError } = await supabase
      .from("employees")
      .select("id")
      .in("section", candidates)
      .limit(1);

    if (useError) {
      toast.error("Could not verify usage", { description: useError.message });
      return;
    }
    if (inUseRows && inUseRows.length > 0) {
      const label = formatTitleForStorage(row.title);
      toast.error("Cannot delete section", {
        description: `At least one employee still has section “${label}”. Update those employees first, then try again.`,
      });
      return;
    }

    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete section", { description: error.message });
      throw error;
    }
    setSections((prev) => prev.filter((r) => r.id !== id));
    void refreshEmployeeUsage();
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
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <DirectoryPanel
          title="Departments"
          items={departments}
          onAdd={addDepartment}
          onUpdate={updateDepartment}
          onDelete={deleteDepartment}
          employeeCount={(item) =>
            countEmployeesForDirectoryRow(item, employeeDepartmentValues)
          }
          isDeleteDisabled={(item) =>
            isDirectoryRowUsedByEmployees(item, employeeDepartmentValues)
          }
          onShowEmployees={(item) =>
            setEmployeeListModal({ field: "department", item })
          }
        />
        <DirectoryPanel
          title="Sections"
          items={sections}
          onAdd={addSection}
          onUpdate={updateSection}
          onDelete={deleteSection}
          employeeCount={(item) =>
            countEmployeesForDirectoryRow(item, employeeSectionValues)
          }
          isDeleteDisabled={(item) =>
            isDirectoryRowUsedByEmployees(item, employeeSectionValues)
          }
          onShowEmployees={(item) =>
            setEmployeeListModal({ field: "section", item })
          }
        />
      </div>
    </>
  );
}
