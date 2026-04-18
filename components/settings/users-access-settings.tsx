"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { loadUserAccessRowsServer } from "@/lib/actions/user-access-data";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  USER_ACCESS_ROLE_DESCRIPTIONS,
  USER_ACCESS_ROLE_LABELS,
  USER_ACCESS_ROLES,
  type UserAccessRole,
  type UserAccessRow,
  normalizeUserAccessEmail,
} from "@/lib/user-access";

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20";

const labelClass = "block text-sm font-medium text-slate-800 dark:text-slate-200";

const MIN_PASSWORD_LEN = 8;

/** Form `<select>` value → stored as `allowed_department: null` (Manager/Viewer full access). */
const ASSIGNED_DEPARTMENT_ALL_VALUE = "__all_departments__";

function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function roleBadgeClass(role: UserAccessRole): string {
  switch (role) {
    case "admin":
      return "bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200";
    case "manager":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200";
    default:
      return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
  }
}

type UsersAccessSettingsProps = {
  /** Prefetched on the settings route (server). */
  directoryPrefetch?: { rows: UserAccessRow[]; error: string | null };
};

export function UsersAccessSettings({
  directoryPrefetch,
}: UsersAccessSettingsProps = {}) {
  const [rows, setRows] = useState<UserAccessRow[]>(
    () => directoryPrefetch?.rows ?? [],
  );
  const [loading, setLoading] = useState(() => !directoryPrefetch);
  const [loadError, setLoadError] = useState<string | null>(
    () => directoryPrefetch?.error ?? null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserAccessRole>("viewer");
  const [formNotes, setFormNotes] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formAllowedDepartment, setFormAllowedDepartment] = useState("");
  /** Manager/viewer only; admin always has timeline access (ignored in save). */
  const [formTimelineAccess, setFormTimelineAccess] = useState(true);
  const [departmentTitles, setDepartmentTitles] = useState<string[]>([]);
  const [pendingDeleteUser, setPendingDeleteUser] =
    useState<UserAccessRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { rows: next, error } = await loadUserAccessRowsServer();
    setLoading(false);
    if (error) {
      setLoadError(error);
      setRows([]);
      return;
    }
    setRows(next);
  }, []);

  useEffect(() => {
    if (directoryPrefetch && !directoryPrefetch.error) {
      setLoading(false);
      return;
    }
    void load();
  }, [directoryPrefetch, load]);

  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("departments")
        .select("title")
        .order("title");
      if (cancelled) return;
      if (error || !data) {
        setDepartmentTitles([]);
        return;
      }
      setDepartmentTitles(
        data.map((r) => String((r as { title: string }).title)),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOpen]);

  /** Edit: saved `allowed_department` no longer exists in Configuration — keep it selectable until admin fixes. */
  const orphanAssignedDepartmentTitle = useMemo(() => {
    if (!editingId || formRole === "admin") return null;
    const cur = formAllowedDepartment;
    if (!cur || cur === ASSIGNED_DEPARTMENT_ALL_VALUE) return null;
    return departmentTitles.includes(cur) ? null : cur;
  }, [editingId, formRole, formAllowedDepartment, departmentTitles]);

  function openAdd() {
    setEditingId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("viewer");
    setFormNotes("");
    setFormAllowedDepartment(ASSIGNED_DEPARTMENT_ALL_VALUE);
    setFormTimelineAccess(true);
    setModalOpen(true);
  }

  function openEdit(row: UserAccessRow) {
    setEditingId(row.id);
    setFormName(row.full_name);
    setFormEmail(row.email);
    setFormPassword("");
    setFormRole(row.access_role);
    setFormNotes(row.notes ?? "");
    setFormAllowedDepartment(
      row.access_role === "admin"
        ? ""
        : row.allowed_department?.trim()
          ? row.allowed_department.trim()
          : ASSIGNED_DEPARTMENT_ALL_VALUE,
    );
    setFormTimelineAccess(
      row.access_role === "admin" ? true : Boolean(row.timeline_access),
    );
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setFormPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = normalizeUserAccessEmail(formEmail);
    const name = formName.trim();
    if (!name) {
      toast.error("Enter a name");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email");
      return;
    }

    if (formRole !== "admin" && !formAllowedDepartment.trim()) {
      toast.error("Select an assigned department scope");
      return;
    }

    if (!editingId) {
      if (formPassword.length < MIN_PASSWORD_LEN) {
        toast.error(
          `Password must be at least ${MIN_PASSWORD_LEN} characters (for login)`,
        );
        return;
      }
    }

    setSaving(true);

    const scopeDepartment =
      formRole === "admin"
        ? null
        : formAllowedDepartment === ASSIGNED_DEPARTMENT_ALL_VALUE ||
            !formAllowedDepartment.trim()
          ? null
          : formAllowedDepartment.trim();

    if (!editingId) {
      const res = await fetch("/api/user-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: formPassword,
          full_name: name,
          access_role: formRole,
          allowed_department: scopeDepartment,
          timeline_access:
            formRole === "admin" ? true : formTimelineAccess,
          notes: formNotes.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      setSaving(false);
      if (!res.ok) {
        toast.error(data.error ?? "Could not add user");
        return;
      }
      toast.success("User added — they can sign in with this email and password");
      setModalOpen(false);
      setEditingId(null);
      setFormPassword("");
      void load();
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("user_access")
      .update({
        full_name: name,
        access_role: formRole,
        allowed_department: scopeDepartment,
        timeline_access:
          formRole === "admin" ? true : formTimelineAccess,
        notes: formNotes.trim(),
      })
      .eq("id", editingId);

    setSaving(false);
    if (error) {
      toast.error("Could not update user", { description: error.message });
      return;
    }
    toast.success("User updated");

    setModalOpen(false);
    setEditingId(null);
    void load();
  }

  async function executeDeleteUser(row: UserAccessRow) {
    const hasLogin = Boolean(row.auth_user_id);
    const res = await fetch("/api/user-access", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });

    if (res.status === 503) {
      toast.error("Could not remove user — server is not configured for this action.");
      return;
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Could not remove user");
      return;
    }
    toast.success(hasLogin ? "User and login removed" : "User removed from list");
    void load();
  }

  function handleDeleteRequest(row: UserAccessRow) {
    setPendingDeleteUser(row);
  }

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Users className="h-6 w-6 shrink-0 opacity-90" strokeWidth={1.75} />
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Users
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:self-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Add user
        </button>
      </div>

      {loadError ? (
        <p
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          Could not load users: {loadError}. Run the{" "}
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/50">
            user_access
          </code>{" "}
          migration in Supabase if this table is missing.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-slate-600 dark:text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80">
                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Name
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Email
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Login
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Access
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Dept scope
                  </th>
                  <th className="min-w-[8rem] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Notes
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-14 text-center text-slate-500 dark:text-slate-400"
                    >
                      No users yet. Use{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        Add user
                      </span>{" "}
                      to grant access.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {row.full_name || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {row.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {row.auth_user_id ? (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            Yes
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(row.access_role)}`}
                          title={USER_ACCESS_ROLE_DESCRIPTIONS[row.access_role]}
                        >
                          {USER_ACCESS_ROLE_LABELS[row.access_role]}
                        </span>
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                        {row.access_role === "admin"
                          ? "—"
                          : row.allowed_department?.trim()
                            ? row.allowed_department
                            : "All departments"}
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                        {row.notes?.trim() ? row.notes : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            aria-label={`Edit ${row.email}`}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            aria-label={`Remove ${row.email}`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8 sm:px-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-access-modal-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h2
              id="user-access-modal-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {editingId ? "Edit user" : "Add user"}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <span className="font-medium text-red-600 dark:text-red-400">
                *
              </span>{" "}
              Required fields. Notes are optional.
              {editingId ? " Email cannot be changed." : null}
            </p>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
              <div>
                <label htmlFor="ua-name" className={labelClass}>
                  Full name
                  <span className="ml-0.5 text-red-600 dark:text-red-400">
                    *
                  </span>
                </label>
                <input
                  id="ua-name"
                  type="text"
                  autoComplete="name"
                  className={inputClass}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="ua-email" className={labelClass}>
                  Email
                  <span className="ml-0.5 text-red-600 dark:text-red-400">
                    *
                  </span>
                </label>
                <input
                  id="ua-email"
                  type="email"
                  autoComplete="email"
                  className={`${inputClass} disabled:opacity-60`}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={Boolean(editingId)}
                  required
                />
                {editingId ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Email cannot be changed. Remove this row and add a new one if
                    the address was wrong.
                  </p>
                ) : null}
              </div>
              {!editingId ? (
                <div>
                  <label htmlFor="ua-password" className={labelClass}>
                    Password
                    <span className="ml-0.5 text-red-600 dark:text-red-400">
                      *
                    </span>
                  </label>
                  <input
                    id="ua-password"
                    type="password"
                    autoComplete="new-password"
                    className={inputClass}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
                    minLength={MIN_PASSWORD_LEN}
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Used for Supabase Auth login (same email).
                  </p>
                </div>
              ) : null}
              <div>
                <label htmlFor="ua-role" className={labelClass}>
                  Access level
                  <span className="ml-0.5 text-red-600 dark:text-red-400">
                    *
                  </span>
                </label>
                <select
                  id="ua-role"
                  className={inputClass}
                  value={formRole}
                  required
                  onChange={(e) => {
                    const r = e.target.value as UserAccessRole;
                    setFormRole(r);
                    if (r === "admin") {
                      setFormAllowedDepartment("");
                      setFormTimelineAccess(true);
                    } else {
                      setFormAllowedDepartment((prev) =>
                        prev.trim() === ""
                          ? ASSIGNED_DEPARTMENT_ALL_VALUE
                          : prev,
                      );
                    }
                  }}
                >
                  {USER_ACCESS_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {USER_ACCESS_ROLE_LABELS[r]} —{" "}
                      {USER_ACCESS_ROLE_DESCRIPTIONS[r]}
                    </option>
                  ))}
                </select>
              </div>
              {formRole === "admin" ? (
                <p className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    Admin
                  </span>{" "}
                  accounts are not limited to one department — they always see
                  all departments. Saving clears any old department assignment.
                </p>
              ) : (
                <div>
                  <label htmlFor="ua-dept-scope" className={labelClass}>
                    Assigned department{" "}
                    <span className="ml-0.5 text-red-600 dark:text-red-400">
                      *
                    </span>
                  </label>
                  <select
                    key={editingId ? `dept-${editingId}` : "dept-new"}
                    id="ua-dept-scope"
                    className={inputClass}
                    value={formAllowedDepartment}
                    onChange={(e) => setFormAllowedDepartment(e.target.value)}
                    required
                  >
                    <option value={ASSIGNED_DEPARTMENT_ALL_VALUE}>
                      All departments
                    </option>
                    {orphanAssignedDepartmentTitle ? (
                      <option value={orphanAssignedDepartmentTitle}>
                        {orphanAssignedDepartmentTitle} (current — not in
                        Configuration)
                      </option>
                    ) : null}
                    {departmentTitles.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      All departments
                    </span>{" "}
                    gives full directory and configuration access (for this
                    role). Pick one department to limit the user to that
                    department only.
                  </p>
                </div>
              )}
              {formRole === "admin" ? (
                <p className="rounded-lg border border-violet-200/80 bg-violet-50/80 px-3 py-2 text-xs leading-relaxed text-violet-900 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-100">
                  <span className="font-medium">Timeline</span> is always
                  available for admins (view and add on employees).
                </p>
              ) : (
                <div className="rounded-lg border border-slate-200/90 bg-slate-50/50 px-3 py-2.5 dark:border-slate-600/80 dark:bg-slate-800/40">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900"
                      checked={formTimelineAccess}
                      onChange={(e) => setFormTimelineAccess(e.target.checked)}
                    />
                    <span>
                      <span className={labelClass}>Allow employee timeline</span>
                      <span className="mt-0.5 block text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                        When enabled, this user can open the{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Timeline
                        </span>{" "}
                        tab when viewing an employee.
                        {formRole === "manager"
                          ? " Managers with this option can also add timeline entries from the directory row menu."
                          : " Viewers can view timelines only, not add."}
                      </span>
                    </span>
                  </label>
                </div>
              )}
              <div>
                <label htmlFor="ua-notes" className={labelClass}>
                  Notes{" "}
                  <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="ua-notes"
                  rows={2}
                  className={`${inputClass} resize-y`}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Department, reason for access…"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="inline-flex min-w-[5rem] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-w-[5rem] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {editingId ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteUser !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteUser(null);
        }}
        title="Remove user?"
        description={
          pendingDeleteUser ? (
            Boolean(pendingDeleteUser.auth_user_id) ? (
              <>
                Remove{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {pendingDeleteUser.email}
                </span>{" "}
                from the app and delete their login?
              </>
            ) : (
              <>
                Remove access for{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {pendingDeleteUser.email}
                </span>
                ? This row has no linked login (added before passwords were
                enabled).
              </>
            )
          ) : null
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          const row = pendingDeleteUser;
          setPendingDeleteUser(null);
          if (row) void executeDeleteUser(row);
        }}
      />
    </div>
  );
}
