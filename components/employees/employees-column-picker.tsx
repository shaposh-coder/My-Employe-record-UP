"use client";

import { useEffect, useRef, useState } from "react";
import { Columns3 } from "lucide-react";
import {
  EMPLOYEE_COLUMN_IDS,
  EMPLOYEE_COLUMN_LABELS,
  type EmployeeColumnId,
  loadColumnVisibility,
  saveColumnVisibility,
} from "@/lib/employee-table-columns";

type EmployeesColumnPickerProps = {
  visibility: Record<EmployeeColumnId, boolean>;
  onChange: (next: Record<EmployeeColumnId, boolean>) => void;
};

export function EmployeesColumnPicker({
  visibility,
  onChange,
}: EmployeesColumnPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function toggle(id: EmployeeColumnId) {
    const next = { ...visibility, [id]: !visibility[id] };
    onChange(next);
    saveColumnVisibility(next);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Columns3 className="h-4 w-4" strokeWidth={2} aria-hidden />
        Columns
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Choose visible columns"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-600 dark:bg-slate-900"
        >
          <p className="border-b border-slate-100 px-3 pb-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Show or hide columns
          </p>
          <ul className="max-h-[min(70vh,22rem)] overflow-y-auto px-2 pt-2">
            {EMPLOYEE_COLUMN_IDS.map((id) => (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={visibility[id] === true}
                    onChange={() => toggle(id)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950"
                  />
                  <span className="select-none">{EMPLOYEE_COLUMN_LABELS[id]}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function useEmployeesColumnVisibility() {
  const [visibility, setVisibility] = useState(() => loadColumnVisibility());
  return { visibility, setVisibility };
}
