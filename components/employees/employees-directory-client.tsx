"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { EmployeesImportExportToolbar } from "@/components/employees/employees-import-export-toolbar";
import { EmployeesPagination } from "@/components/employees/employees-pagination";
import { EmployeesTableLoadingOverlay } from "@/components/employees/employees-table-loading-overlay";
import { EmployeesTable } from "@/components/employees/employees-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteEmployeeRow,
  loadEmployeesDirectory,
  updateEmployeeStatusRow,
} from "@/lib/actions/employees-data";
import {
  DEFAULT_EMPLOYEES_PAGE_SIZE,
  EMPLOYEES_PAGE_SIZE_OPTIONS,
  type EmployeesPageSize,
  type FetchEmployeesOptions,
  parseEmployeesStatusQueryParam,
} from "@/lib/fetch-employees";
import {
  EMPLOYEE_STATUS,
  type EmployeeStoredStatus,
} from "@/lib/employee-status";

export type EmployeesDirectoryClientProps = {
  initialRows: EmployeeListRow[];
  initialTotal: number;
  initialLoadError: string | null;
  initialDepartmentOptions: string[];
  initialSectionOptions: string[];
  initialCityOptions: string[];
};

export function EmployeesDirectoryClient({
  initialRows,
  initialTotal,
  initialLoadError,
  initialDepartmentOptions,
  initialSectionOptions,
  initialCityOptions,
}: EmployeesDirectoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, allowedDepartment, canViewTimeline, canAddTimeline } =
    useUserAccess();
  const scopedDept = allowedDepartment?.trim() ?? "";

  const departmentParam = searchParams.get("department") ?? "";
  const sectionParam = searchParams.get("section") ?? "";
  const cityParam = searchParams.get("city") ?? "";
  const readOnly = role === "viewer";
  const { setEndSlot } = useTopbarEndSlot();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<EmployeesPageSize>(DEFAULT_EMPLOYEES_PAGE_SIZE);
  const [rows, setRows] = useState<EmployeeListRow[]>(initialRows);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [listLoading, setListLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(
    null,
  );
  /** Snapshot from table for instant modal content while full row loads. */
  const [detailRowSnapshot, setDetailRowSnapshot] =
    useState<EmployeeListRow | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(
    null,
  );
  const [pendingDeleteEmployeeId, setPendingDeleteEmployeeId] = useState<
    string | null
  >(null);
  const { visibility, setVisibility } = useEmployeesColumnVisibility();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [nameFilterInput, setNameFilterInput] = useState("");
  const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
  const [cnicFilterInput, setCnicFilterInput] = useState("");
  const [debouncedCnicFilter, setDebouncedCnicFilter] = useState("");
  const [department, setDepartment] = useState(
    () => scopedDept || (searchParams.get("department") ?? ""),
  );
  const [section, setSection] = useState(
    () => searchParams.get("section") ?? "",
  );
  const [city, setCity] = useState(() => searchParams.get("city") ?? "");
  const [status, setStatus] = useState<"" | EmployeeStoredStatus>(() =>
    parseEmployeesStatusQueryParam(searchParams.get("status")),
  );
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(
    initialDepartmentOptions,
  );
  const [sectionOptions, setSectionOptions] = useState<string[]>(
    initialSectionOptions,
  );
  const [cityOptions, setCityOptions] = useState<string[]>(initialCityOptions);

  const lastDirectoryKey = useRef<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedNameFilter(nameFilterInput);
    }, 300);
    return () => window.clearTimeout(id);
  }, [nameFilterInput]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedCnicFilter(cnicFilterInput);
    }, 300);
    return () => window.clearTimeout(id);
  }, [cnicFilterInput]);

  useEffect(() => {
    if (scopedDept) {
      setDepartment(scopedDept);
      setSection(sectionParam);
      setCity(cityParam);
      return;
    }
    setDepartment(departmentParam);
    setSection(sectionParam);
    setCity(cityParam);
  }, [departmentParam, sectionParam, cityParam, scopedDept]);

  useEffect(() => {
    setStatus(parseEmployeesStatusQueryParam(searchParams.get("status")));
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    debouncedNameFilter,
    debouncedCnicFilter,
    status,
    department,
    section,
    city,
  ]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalCount, pageSize, page]);

  const filterCriteria = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      name: debouncedNameFilter.trim() || undefined,
      cnic: debouncedCnicFilter.trim() || undefined,
      department: department.trim() || undefined,
      section: section.trim() || undefined,
      city: city.trim() || undefined,
      status: status || undefined,
    }),
    [
      debouncedSearch,
      debouncedNameFilter,
      debouncedCnicFilter,
      department,
      section,
      city,
      status,
    ],
  );

  const directoryCriteriaKey = useMemo(
    () =>
      JSON.stringify({
        page,
        pageSize,
        ...filterCriteria,
      }),
    [page, pageSize, filterCriteria],
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        debouncedSearch.trim() ||
          debouncedNameFilter.trim() ||
          debouncedCnicFilter.trim() ||
          department.trim() ||
          section.trim() ||
          city.trim() ||
          status,
      ),
    [
      debouncedSearch,
      debouncedNameFilter,
      debouncedCnicFilter,
      department,
      section,
      city,
      status,
    ],
  );

  const activeFilterCount = useMemo(
    () =>
      (nameFilterInput.trim() ? 1 : 0) +
      (cnicFilterInput.trim() ? 1 : 0) +
      [department, section, city].filter((v) => v.trim() !== "").length +
      (status ? 1 : 0),
    [nameFilterInput, cnicFilterInput, department, section, city, status],
  );

  const exportFilters = useMemo((): Omit<
    FetchEmployeesOptions,
    "page" | "pageSize"
  > => {
    return {
      search: debouncedSearch.trim() || undefined,
      name: debouncedNameFilter.trim() || undefined,
      cnic: debouncedCnicFilter.trim() || undefined,
      department: department.trim() || undefined,
      section: section.trim() || undefined,
      city: city.trim() || undefined,
      status: status || undefined,
    };
  }, [
    debouncedSearch,
    debouncedNameFilter,
    debouncedCnicFilter,
    department,
    section,
    city,
    status,
  ]);

  const loadRows = useCallback(async () => {
    const { rows: next, total, error } = await loadEmployeesDirectory({
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
    if (lastDirectoryKey.current === null) {
      lastDirectoryKey.current = directoryCriteriaKey;
      return;
    }
    if (lastDirectoryKey.current === directoryCriteriaKey) {
      return;
    }
    lastDirectoryKey.current = directoryCriteriaKey;
    let cancelled = false;
    setListLoading(true);
    void loadRows().then(() => {
      if (!cancelled) {
        setListLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [directoryCriteriaKey, loadRows]);

  const handleDeleteRequest = useCallback((id: string) => {
    setPendingDeleteEmployeeId(id);
  }, []);

  const confirmDeleteEmployee = useCallback(async () => {
    const id = pendingDeleteEmployeeId;
    if (!id) return;
    setPendingDeleteEmployeeId(null);
    const { error } = await deleteEmployeeRow(id);
    if (error) {
      toast.error("Could not delete employee", {
        description: error,
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
  }, [loadRows, page, pendingDeleteEmployeeId]);

  const handleToggleStatus = useCallback(
    async (row: EmployeeListRow) => {
      const current = row.status ?? "Active";
      const next =
        current === "Active" ? EMPLOYEE_STATUS.UnActive : EMPLOYEE_STATUS.Active;
      setStatusUpdatingId(row.id);
      try {
        const { error } = await updateEmployeeStatusRow(row.id, next);
        if (error) {
          toast.error("Could not update status", {
            description: error,
          });
          return;
        }
        toast.success(
          next === EMPLOYEE_STATUS.Active
            ? "Employee is now Active"
            : "Employee is now Un-Active",
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
    setNameFilterInput("");
    setDebouncedNameFilter("");
    setCnicFilterInput("");
    setDebouncedCnicFilter("");
    setDepartment(scopedDept);
    setSection("");
    setCity("");
    setStatus("");
    setPage(1);
    router.replace("/employees", { scroll: false });
  }, [router, scopedDept]);

  const handleDepartmentChange = useCallback(
    (v: string) => {
      if (scopedDept) return;
      setDepartment(v);
      setPage(1);
    },
    [scopedDept],
  );

  const handleSectionChange = useCallback((v: string) => {
    setSection(v);
    setPage(1);
  }, []);

  const handleCityChange = useCallback((v: string) => {
    setCity(v);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback(
    (v: string) => {
      let next: "" | EmployeeStoredStatus = "";
      if (v === EMPLOYEE_STATUS.Active) next = EMPLOYEE_STATUS.Active;
      else if (v === EMPLOYEE_STATUS.UnActive) next = EMPLOYEE_STATUS.UnActive;
      setStatus(next);
      setPage(1);
      const sp = new URLSearchParams(searchParams.toString());
      if (!next) {
        sp.delete("status");
      } else if (next === EMPLOYEE_STATUS.Active) {
        sp.set("status", "active");
      } else {
        sp.set("status", "un-active");
      }
      const q = sp.toString();
      router.replace(q ? `/employees?${q}` : "/employees", { scroll: false });
    },
    [router, searchParams],
  );

  const openEmployeeDetail = useCallback((row: EmployeeListRow) => {
    setDetailRowSnapshot(row);
    setDetailEmployeeId(row.id);
  }, []);

  const employeesTopbarSlot = useMemo(
    () => (
      <>
        <EmployeesFilterBar
          variant="toolbar"
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          filterName={nameFilterInput}
          filterCnic={cnicFilterInput}
          onFilterNameChange={setNameFilterInput}
          onFilterCnicChange={setCnicFilterInput}
          department={department}
          section={section}
          city={city}
          status={status}
          onDepartmentChange={handleDepartmentChange}
          onSectionChange={handleSectionChange}
          onCityChange={handleCityChange}
          onStatusChange={handleStatusChange}
          departmentOptions={departmentOptions}
          sectionOptions={sectionOptions}
          cityOptions={cityOptions}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          filterControlsDisabled={listLoading}
          departmentLocked={Boolean(scopedDept)}
        />
        <EmployeesImportExportToolbar
          exportFilters={exportFilters}
          listLoading={listLoading}
          readOnly={readOnly}
          onImportComplete={() => void loadRows()}
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <EmployeesColumnPicker
            visibility={visibility}
            onChange={setVisibility}
          />
          {readOnly ? null : (
            <Link
              href="/employees/new"
              prefetch={false}
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
      nameFilterInput,
      cnicFilterInput,
      department,
      section,
      city,
      status,
      departmentOptions,
      sectionOptions,
      cityOptions,
      hasActiveFilters,
      activeFilterCount,
      exportFilters,
      listLoading,
      visibility,
      loadRows,
      handleDepartmentChange,
      handleSectionChange,
      handleCityChange,
      handleStatusChange,
      handleClearFilters,
      setVisibility,
      readOnly,
      scopedDept,
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-2xl"
          aria-busy={listLoading}
        >
          <EmployeesTableLoadingOverlay active={listLoading} />
          <EmployeesTable
            embedInCard
            readOnly={readOnly}
            canAddTimeline={canAddTimeline}
            rows={rows}
            visibility={visibility}
            directoryLoading={listLoading && rows.length === 0}
            onDelete={handleDeleteRequest}
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

      <EmployeeDetailModal
        employeeId={detailEmployeeId}
        initialListRow={detailRowSnapshot}
        showTimelineTab={canViewTimeline}
        canEditTimeline={canAddTimeline}
        onClose={() => {
          setDetailEmployeeId(null);
          setDetailRowSnapshot(null);
        }}
        canEdit={!readOnly}
      />

      <ConfirmDialog
        open={pendingDeleteEmployeeId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteEmployeeId(null);
        }}
        title="Delete employee?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void confirmDeleteEmployee()}
      />
    </div>
  );
}
