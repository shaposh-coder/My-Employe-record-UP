"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Eye, Loader2, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import type { EmployeeListRow } from "./employee-list-row";

export function EmployeeRowActionsMenu({
  row,
  onDelete,
  onView,
  onToggleStatus,
  statusUpdatingId,
}: {
  row: EmployeeListRow;
  onDelete: (id: string) => void | Promise<void>;
  /** Opens the same employee detail modal as name / profile image. */
  onView?: (id: string) => void;
  onToggleStatus?: (row: EmployeeListRow) => void | Promise<void>;
  statusUpdatingId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuPos(null);
      return;
    }
    const r = buttonRef.current.getBoundingClientRect();
    setMenuPos({
      top: r.bottom + 4,
      right: typeof window !== "undefined" ? window.innerWidth - r.right : 0,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const isActive = (row.status ?? "Active") === "Active";
  const nextVerb = isActive ? "Mark Un-Active" : "Activate";
  const busy = statusUpdatingId === row.id;

  const menu = open && menuPos && (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        top: menuPos.top,
        right: menuPos.right,
        zIndex: 200,
      }}
      className="min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-slate-600 dark:bg-slate-800 dark:ring-white/10"
    >
      <Link
        href={`/employees/${row.id}/edit`}
        role="menuitem"
        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/80"
        onClick={close}
      >
        <Pencil className="h-4 w-4 shrink-0" strokeWidth={2} />
        Edit
      </Link>
      {onView ? (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/80"
          onClick={() => {
            close();
            onView(row.id);
          }}
        >
          <Eye className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          View
        </button>
      ) : null}
      {onToggleStatus ? (
        <button
          type="button"
          role="menuitem"
          disabled={busy}
          className={[
            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition disabled:opacity-50",
            isActive
              ? "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
              : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
          ].join(" ")}
          onClick={() => {
            void onToggleStatus(row);
          }}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Power className="h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          {nextVerb}
        </button>
      ) : null}
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => {
          close();
          void onDelete(row.id);
        }}
      >
        <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
        Delete
      </button>
    </div>
  );

  return (
    <div
      ref={wrapRef}
      className="flex justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Actions for ${row.full_name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-5 w-5" strokeWidth={2} />
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
