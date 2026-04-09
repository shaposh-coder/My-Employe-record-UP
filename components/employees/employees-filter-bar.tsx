"use client";

import * as Popover from "@radix-ui/react-popover";
import { ListFilter, Search, X } from "lucide-react";
import { memo, useState } from "react";
import { SearchableSelect } from "./searchable-select";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";

const STATUS_FILTER_OPTIONS = [
  EMPLOYEE_STATUS.Active,
  EMPLOYEE_STATUS.UnActive,
] as const;

const textFilterInputClass =
  "w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/[0.08] disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20";

function EmployeesFilterBarInner({
  searchQuery,
  onSearchChange,
  filterName,
  filterCnic,
  onFilterNameChange,
  onFilterCnicChange,
  department,
  section,
  city,
  status,
  onDepartmentChange,
  onSectionChange,
  onCityChange,
  onStatusChange,
  departmentOptions,
  sectionOptions,
  cityOptions,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  /** Disables filter popover + dropdowns while data loads. Search stays focused & editable. */
  filterControlsDisabled,
  /** Narrow bar for header row — sits left of action buttons. */
  variant = "default",
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterName: string;
  filterCnic: string;
  onFilterNameChange: (value: string) => void;
  onFilterCnicChange: (value: string) => void;
  department: string;
  section: string;
  city: string;
  /** Empty string = all statuses. */
  status: string;
  onDepartmentChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  departmentOptions: string[];
  sectionOptions: string[];
  cityOptions: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  /** Number of active filters (Name / CNIC / Department / Section / City / Status). */
  activeFilterCount: number;
  filterControlsDisabled?: boolean;
  variant?: "default" | "toolbar";
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toolbar = variant === "toolbar";

  return (
    <div
      className={
        toolbar
          ? "min-w-0 shrink"
          : "mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40 sm:p-4"
      }
      role="search"
    >
      <label htmlFor="employees-search" className="sr-only">
        Search employees by name, phone, or city
      </label>

      <Popover.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div
          className={[
            "flex min-w-0 items-stretch overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-slate-200/60 transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200/70 dark:border-slate-600 dark:bg-slate-800/80 dark:ring-slate-700/40 dark:focus-within:border-slate-500 dark:focus-within:ring-slate-600/35",
            toolbar
              ? "h-11 w-full max-w-[240px] sm:max-w-[280px] md:max-w-[20rem]"
              : "h-11 w-full",
          ].join(" ")}
        >
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
              strokeWidth={2}
              aria-hidden
            />
            <input
              id="employees-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, phone, CNIC, city, department, section…"
              autoComplete="off"
              className="h-full min-w-0 flex-1 border-0 bg-transparent py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={filterControlsDisabled}
              aria-label="Open filters"
              aria-expanded={filtersOpen}
              className="relative flex w-12 shrink-0 items-center justify-center border-l border-slate-200/90 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100"
            >
              <ListFilter className="h-4 w-4" strokeWidth={2} />
              {activeFilterCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold leading-none text-white dark:bg-slate-100 dark:text-slate-900">
                  {activeFilterCount > 9 ? "9+" : activeFilterCount}
                </span>
              ) : null}
            </button>
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-[200] w-[min(calc(100vw-2rem),20rem)] rounded-xl border border-slate-200/90 bg-white p-3 shadow-lg outline-none dark:border-slate-600 dark:bg-slate-900"
          >
            <div className="mb-3 flex flex-col gap-3 border-b border-slate-100 pb-3 dark:border-slate-700">
              <div>
                <label
                  htmlFor="employees-filter-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Name
                </label>
                <input
                  id="employees-filter-name"
                  type="text"
                  value={filterName}
                  onChange={(e) => onFilterNameChange(e.target.value)}
                  placeholder="Type to filter by name"
                  autoComplete="off"
                  disabled={filterControlsDisabled}
                  className={textFilterInputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="employees-filter-cnic"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  CNIC#
                </label>
                <input
                  id="employees-filter-cnic"
                  type="text"
                  value={filterCnic}
                  onChange={(e) => onFilterCnicChange(e.target.value)}
                  placeholder="Type CNIC (digits or full format)"
                  autoComplete="off"
                  disabled={filterControlsDisabled}
                  className={textFilterInputClass}
                />
              </div>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Filters
            </p>
            <div className="flex flex-col gap-3">
              <SearchableSelect
                label="Department"
                value={department}
                onChange={onDepartmentChange}
                options={departmentOptions}
                emptyOptionLabel="All departments"
                disabled={filterControlsDisabled}
              />
              <SearchableSelect
                label="Section"
                value={section}
                onChange={onSectionChange}
                options={sectionOptions}
                emptyOptionLabel="All sections"
                disabled={filterControlsDisabled}
              />
              <SearchableSelect
                label="City"
                value={city}
                onChange={onCityChange}
                options={cityOptions}
                emptyOptionLabel="All cities"
                disabled={filterControlsDisabled}
              />
              <SearchableSelect
                label="Status"
                value={status}
                onChange={onStatusChange}
                options={[...STATUS_FILTER_OPTIONS]}
                emptyOptionLabel="All statuses"
                disabled={filterControlsDisabled}
              />
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
                <button
                  type="button"
                  disabled={filterControlsDisabled}
                  onClick={() => {
                    onClearFilters();
                    setFiltersOpen(false);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-slate-50 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Clear search & filters
                </button>
              </div>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

export const EmployeesFilterBar = memo(EmployeesFilterBarInner);
