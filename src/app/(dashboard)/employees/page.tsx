"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { useUserAccess } from "@/components/dashboard/user-access-context";
import { useTopbarEndSlot } from "@/components/dashboard/topbar-slot-context";
import {
  EmployeesColumnPicker,
  useEmployeesColumnVisibility,
} from "@/components/employees/employees-column-picker";
import { EmployeeDetailModal } from "@/components/employees/employee-detail-modal";
import type { EmployeeListRow } from "@/components/employees/employee-list-row";
import { EmployeesFilterBar } from "@/components/employees/employees-filter-bar";
import { EmployeesPagination } from "@/components/employees/employees-pagination";
import { EmployeesTableLoadingOverlay } from "@/components/employees/employees-table-loading-overlay";
import { EmployeesTableSkeleton } from "@/components/employees/employees-table-skeleton";
import { EmployeesTable } from "@/components/employees/employees-table";
import { fetchEmployeeFilterOptions } from "@/lib/fetch-employee-filter-options";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_EMPLOYEES_PAGE_SIZE,
  EMPLOYEES_PAGE_SIZE_OPTIONS,
  type EmployeesPageSize,
  fetchEmployees,
} from "@/lib/fetch-employees";

export default function EmployeesPage() {
  const { role } = useUserAccess();
  const readOnly = role === "viewer";
  const { setEndSlot } = useTopbarEndSlot();
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

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [city, setCity] = useState("");
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  /** Immediate UI: searchInput. Server filter uses debouncedSearch after 300ms. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  /** If the result set shrinks (filters, deletes), avoid staying past the last page. */
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalCount, pageSize, page]);

  const filterCriteria = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      department: department.trim() || undefined,
      section: section.trim() || undefined,
      city: city.trim() || undefined,
    }),
    [debouncedSearch, department, section, city],
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        debouncedSearch.trim() ||
          department.trim() ||
          section.trim() ||
          city.trim(),
      ),
    [debouncedSearch, department, section, city],
  );

  const activeFilterCount = useMemo(
    () =>
      [department, section, city].filter((v) => v.trim() !== "").length,
    [department, section, city],
  );

  useEffect(() => {
    void fetchEmployeeFilterOptions().then((r) => {
      if (r.error) return;
      setDepartmentOptions(r.departments);
      setSectionOptions(r.sections);
      setCityOptions(r.cities);
    });
  }, []);

  const loadRows = useCallback(async () => {
    const { rows: next, total, error } = await fetchEmployees({
      page,
      pageSize,
      ...filterCriteria,
    });
    setLoadError(error);
    if (error) {
      return {
        rows: [] as EmployeeListRow[],
        total: 0,
        error,
      };
    }
    setRows(next);
    setTotalCount(total);
    return { rows: next, total, error: null };
  }, [page, pageSize, filterCriteria]);

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
      void fetchEmployeeFilterOptions().then((r) => {
        if (r.error) return;
        setDepartmentOptions(r.departments);
        setSectionOptions(r.sections);
        setCityOptions(r.cities);
      });
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

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setDepartment("");
    setSection("");
    setCity("");
    setPage(1);
  }, []);

  const handleDepartmentChange = useCallback((v: string) => {
    setDepartment(v);
    setPage(1);
  }, []);

  const handleSectionChange = useCallback((v: string) => {
    setSection(v);
    setPage(1);
  }, []);

  const handleCityChange = useCallback((v: string) => {
    setCity(v);
    setPage(1);
  }, []);

  const openEmployeeDetail = useCallback((id: string) => {
    setDetailEmployeeId(id);
  }, []);

  const employeesTopbarSlot = useMemo(
    () => (
      <>
        <EmployeesFilterBar
          variant="toolbar"
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          department={department}
          section={section}
          city={city}
          onDepartmentChange={handleDepartmentChange}
          onSectionChange={handleSectionChange}
          onCityChange={handleCityChange}
          departmentOptions={departmentOptions}
          sectionOptions={sectionOptions}
          cityOptions={cityOptions}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          filterControlsDisabled={listLoading}
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <EmployeesColumnPicker
            visibility={visibility}
            onChange={setVisibility}
          />
          {readOnly ? null : (
            <Link
              href="/employees/new"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:px-4"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Add
            </Link>
          )}
        </div>
      </>
    ),
    [
      searchInput,
      department,
      section,
      city,
      departmentOptions,
      sectionOptions,
      cityOptions,
      hasActiveFilters,
      activeFilterCount,
      listLoading,
      visibility,
      handleDepartmentChange,
      handleSectionChange,
      handleCityChange,
      handleClearFilters,
      setVisibility,
      readOnly,
    ],
  );

  useLayoutEffect(() => {
    setEndSlot(employeesTopbarSlot);
    return () => setEndSlot(null);
  }, [employeesTopbarSlot, setEndSlot]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {loadError ? (
        <p
          className="mb-4 shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          Could not load employees: {loadError}
        </p>
      ) : null}

      {!ready ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-t-2xl">
            <EmployeesTableSkeleton
              visibility={visibility}
              rowCount={pageSize}
              embedInCard
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          <div
            className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-t-2xl"
            aria-busy={listLoading}
          >
            <EmployeesTableLoadingOverlay active={listLoading} />
            <EmployeesTable
              embedInCard
              readOnly={readOnly}
              rows={rows}
              visibility={visibility}
              onDelete={handleDelete}
              onEmployeeNameClick={openEmployeeDetail}
              onToggleStatus={handleToggleStatus}
              statusUpdatingId={statusUpdatingId}
            />
          </div>
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
        canEdit={!readOnly}
      />
    </div>
  );
}
