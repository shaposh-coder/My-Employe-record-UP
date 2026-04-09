"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchEmployeeFullById } from "@/lib/fetch-employee-by-id";
import { fetchEmployeeFilterOptions } from "@/lib/fetch-employee-filter-options";
import {
  fetchAllEmployeesForExport,
  fetchEmployees,
  type FetchEmployeesOptions,
} from "@/lib/fetch-employees";

export async function loadEmployeesDirectory(options: FetchEmployeesOptions) {
  const supabase = await createClient();
  return fetchEmployees(supabase, options);
}

export async function loadDirectoryFilterOptions() {
  const supabase = await createClient();
  return fetchEmployeeFilterOptions(supabase);
}

export async function loadEmployeeFullForModal(id: string) {
  const supabase = await createClient();
  return fetchEmployeeFullById(supabase, id);
}

export async function loadEmployeesForCsvExport(
  filters: Omit<FetchEmployeesOptions, "page" | "pageSize">,
) {
  const supabase = await createClient();
  return fetchAllEmployeesForExport(supabase, filters);
}

export async function deleteEmployeeRow(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function updateEmployeeStatusRow(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ status })
    .eq("id", id);
  return { error: error?.message ?? null };
}
