"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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
}: {
  title: string;
  items: DirectoryItem[];
  onAdd: (item: { title: string; description: string }) => void | Promise<void>;
  onUpdate: (
    id: string,
    item: { title: string; description: string },
  ) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
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
                  <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {item.title}
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
                        onClick={() => {
                          const ok = window.confirm(
                            `Delete “${item.title}”? This cannot be undone.`,
                          );
                          if (ok) void onDelete(item.id);
                        }}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                        aria-label={`Delete ${item.title}`}
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

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
  }

  async function deleteDepartment(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete department", { description: error.message });
      throw error;
    }
    setDepartments((prev) => prev.filter((row) => row.id !== id));
  }

  async function deleteSection(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete section", { description: error.message });
      throw error;
    }
    setSections((prev) => prev.filter((row) => row.id !== id));
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
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <DirectoryPanel
        title="Departments"
        items={departments}
        onAdd={addDepartment}
        onUpdate={updateDepartment}
        onDelete={deleteDepartment}
      />
      <DirectoryPanel
        title="Sections"
        items={sections}
        onAdd={addSection}
        onUpdate={updateSection}
        onDelete={deleteSection}
      />
    </div>
  );
}
