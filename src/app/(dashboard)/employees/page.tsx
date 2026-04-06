"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EmployeesColumnPicker,
  useEmployeesColumnVisibility,
} from "@/components/employees/employees-column-picker";
import { EmployeeDetailModal } from "@/components/employees/employee-detail-modal";
import type { EmployeeListRow } from "@/components/employees/employee-list-row";
import { EmployeesPagination } from "@/components/employees/employees-pagination";
import { EmployeesTable } from "@/components/employees/employees-table";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_EMPLOYEES_PAGE_SIZE,
  EMPLOYEES_PAGE_SIZE_OPTIONS,
  type EmployeesPageSize,
  fetchEmployeesForTable,
} from "@/lib/fetch-employees";

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<EmployeesPageSize>(DEFAULT_EMPLOYEES_PAGE_SIZE);
  const [rows, setRows] = useState<EmployeeListRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(
    null,
  );
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(
    null,
  );
  const { visibility, setVisibility } = useEmployeesColumnVisibility();

  const loadRows = useCallback(async () => {
    const { rows: next, total, error } = await fetchEmployeesForTable({
      page,
      pageSize,
    });
    setLoadError(error);
    if (error) {
      setRows([]);
      setTotalCount(0);
      return { rows: [] as EmployeeListRow[], total: 0, error };
    }
    setRows(next);
    setTotalCount(total);
    return { rows: next, total, error: null };
  }, [page, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    void loadRows().then(() => {
      if (!cancelled) {
        setListLoading(false);
        setReady(true);
      }
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
      const result = await loadRows();
      if (
        result &&
        !result.error &&
        result.rows.length === 0 &&
        page > 1
      ) {
        setPage((p) => p - 1);
      }
    },
    [loadRows, page],
  );

  const handleToggleStatus = useCallback(
    async (row: EmployeeListRow) => {
      const current = row.status ?? "Active";
      const next = current === "Active" ? "Deactive" : "Active";
      setStatusUpdatingId(row.id);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("employees")
          .update({ status: next })
          .eq("id", row.id);
        if (error) {
          toast.error("Could not update status", {
            description: error.message,
          });
          return;
        }
        toast.success(
          next === "Active"
            ? "Employee is now Active"
            : "Employee is now Deactive",
        );
        void loadRows();
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [loadRows],
  );

  const handlePageSizeChange = useCallback((size: EmployeesPageSize) => {
    setPageSize(size);
    setPage(1);
  }, []);

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
        <div
          className={
            listLoading ? "pointer-events-none opacity-60 transition-opacity" : ""
          }
        >
          <EmployeesTable
            rows={rows}
            visibility={visibility}
            onDelete={handleDelete}
            onEmployeeNameClick={(id) => setDetailEmployeeId(id)}
            onToggleStatus={handleToggleStatus}
            statusUpdatingId={statusUpdatingId}
          />
          <EmployeesPagination
            page={page}
            pageSize={pageSize}
            pageSizeOptions={EMPLOYEES_PAGE_SIZE_OPTIONS}
            total={totalCount}
            disabled={listLoading}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      <EmployeeDetailModal
        employeeId={detailEmployeeId}
        onClose={() => setDetailEmployeeId(null)}
      />
    </div>
  );
}
