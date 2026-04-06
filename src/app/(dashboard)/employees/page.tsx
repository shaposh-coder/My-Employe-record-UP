"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EmployeesColumnPicker,
  useEmployeesColumnVisibility,
} from "@/components/employees/employees-column-picker";
import {
  EmployeesTable,
  type EmployeeListRow,
} from "@/components/employees/employees-table";
import { createClient } from "@/lib/supabase/client";
import { fetchEmployeesForTable } from "@/lib/fetch-employees";

export default function EmployeesPage() {
  const [rows, setRows] = useState<EmployeeListRow[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { visibility, setVisibility } = useEmployeesColumnVisibility();

  const loadRows = useCallback(async () => {
    const { rows: next, error } = await fetchEmployeesForTable();
    setRows(next);
    setLoadError(error);
    return error;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void loadRows().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [loadRows]);

  useEffect(() => {
    function onFocus() {
      void loadRows();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadRows]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "Delete this employee? This cannot be undone.",
        )
      ) {
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) {
        toast.error("Could not delete employee", {
          description: error.message,
        });
        return;
      }
      toast.success("Employee deleted");
      void loadRows();
    },
    [loadRows],
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Employee Management
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <EmployeesColumnPicker
            visibility={visibility}
            onChange={setVisibility}
          />
          <Link
            href="/employees/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Add employee
          </Link>
        </div>
      </div>

      {loadError ? (
        <p
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          Could not load employees: {loadError}
        </p>
      ) : null}

      {!ready ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-400">
          Loading…
        </div>
      ) : (
        <EmployeesTable
          rows={rows}
          visibility={visibility}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
