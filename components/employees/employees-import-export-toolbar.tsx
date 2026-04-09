"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { loadEmployeesForCsvExport } from "@/lib/actions/employees-data";
import {
  buildEmployeesCsv,
  csvRowHasRequiredFieldsForInsert,
  csvRowToEmployeePatch,
  csvRowToSocialLinksPatch,
  normalizeImportCnic,
  parseEmployeesCsvForImport,
} from "@/lib/employees-csv";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";
import type { SocialLinksRecord } from "@/lib/social-links";
import type { FetchEmployeesOptions } from "@/lib/fetch-employees";

const btnClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/80 sm:px-3.5";

type Props = {
  /** Same filters as the directory table (export applies these). */
  exportFilters: Omit<FetchEmployeesOptions, "page" | "pageSize">;
  listLoading: boolean;
  readOnly: boolean;
  onImportComplete: () => void;
};

function mergeSocialLinks(
  prev: unknown,
  incoming: SocialLinksRecord | null,
): SocialLinksRecord | null {
  if (!incoming || Object.keys(incoming).length === 0) return null;
  const base =
    prev && typeof prev === "object" && prev !== null && !Array.isArray(prev)
      ? (prev as SocialLinksRecord)
      : {};
  return { ...base, ...incoming };
}

export function EmployeesImportExportToolbar({
  exportFilters,
  listLoading,
  readOnly,
  onImportComplete,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { rows, error } = await loadEmployeesForCsvExport(exportFilters);
      if (error) {
        toast.error("Could not export", { description: error });
        return;
      }
      const csv = buildEmployeesCsv(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `employees-${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export ready", {
        description: `${rows.length} row(s) downloaded.`,
      });
    } finally {
      setExporting(false);
    }
  }, [exportFilters]);

  const runImport = useCallback(
    async (file: File) => {
      const text = await file.text();
      const parsed = parseEmployeesCsvForImport(text);
      if (parsed.error) {
        toast.error("Invalid file", { description: parsed.error });
        return;
      }
      if (parsed.rows.length === 0) {
        toast.error("No data rows", { description: "Add at least one data row." });
        return;
      }

      setImporting(true);
      const supabase = createClient();
      let updated = 0;
      let inserted = 0;
      let failed = 0;

      try {
        for (let i = 0; i < parsed.rows.length; i++) {
          const { byHeader } = parsed.rows[i];
          const rawCnic = byHeader["CNIC#"];
          const cnic = rawCnic ? normalizeImportCnic(rawCnic) : null;
          if (!cnic) {
            failed += 1;
            continue;
          }

          const patch = csvRowToEmployeePatch(byHeader);
          const socialPatch = csvRowToSocialLinksPatch(byHeader);

          const { data: existing, error: selErr } = await supabase
            .from("employees")
            .select("id, social_links")
            .eq("cnic_no", cnic)
            .maybeSingle();

          if (selErr) {
            failed += 1;
            continue;
          }

          if (existing?.id) {
            const updatePayload: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(patch)) {
              if (v != null && v !== "") updatePayload[k] = v;
            }
            const mergedSocial = mergeSocialLinks(
              existing.social_links,
              socialPatch,
            );
            if (mergedSocial) {
              updatePayload.social_links = mergedSocial;
            }
            if (Object.keys(updatePayload).length === 0) {
              continue;
            }
            const { error: upErr } = await supabase
              .from("employees")
              .update(updatePayload)
              .eq("id", existing.id);
            if (upErr) failed += 1;
            else updated += 1;
          } else {
            if (!csvRowHasRequiredFieldsForInsert(patch)) {
              failed += 1;
              continue;
            }
            const mergedSocial = socialPatch;
            const insertPayload: Record<string, unknown> = {
              full_name: patch.full_name,
              cnic_no: cnic,
              father_name: patch.father_name ?? null,
              dob: patch.dob ?? null,
              phone_no: patch.phone_no ?? null,
              city: patch.city ?? null,
              address: patch.address ?? null,
              department: patch.department,
              section: patch.section ?? null,
              education: patch.education ?? null,
              experience: patch.experience ?? null,
              email_address: patch.email_address ?? null,
              ss_eubi_no: patch.ss_eubi_no ?? null,
              basic_salary: patch.basic_salary ?? null,
              reference_info: patch.reference_info ?? null,
              family_cnic: patch.family_cnic ?? null,
              family_phone: patch.family_phone ?? null,
              family_phone_alt: patch.family_phone_alt ?? null,
              status: patch.status ?? EMPLOYEE_STATUS.Active,
              profile_image: "",
              other_documents: [],
              social_links: mergedSocial ?? null,
            };
            const { error: insErr } = await supabase
              .from("employees")
              .insert(insertPayload);
            if (insErr) failed += 1;
            else inserted += 1;
          }
        }

        toast.success("Import finished", {
          description: `Updated ${updated}, new ${inserted}${failed ? `, skipped ${failed}` : ""}.`,
        });
        onImportComplete();
      } finally {
        setImporting(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [onImportComplete],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please choose a .csv file");
        return;
      }
      void runImport(file);
    },
    [runImport],
  );

  const busy = listLoading || exporting || importing;

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        className={btnClass}
        disabled={busy}
        onClick={() => void handleExport()}
        title="Download employees as CSV (same columns as Add Employee form, no images/documents)"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
        <span className="hidden sm:inline">Export</span>
      </button>

      {readOnly ? null : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-hidden
            onChange={onFileChange}
          />
          <button
            type="button"
            className={btnClass}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            title="Import CSV — match CNIC# to update; new rows need all required form fields"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
            <span className="hidden sm:inline">Import</span>
          </button>
        </>
      )}
    </div>
  );
}
