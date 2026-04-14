"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchAllowedDepartmentForSession } from "@/lib/fetch-allowed-department-for-session";
import { fetchConfigurationDirectorySnapshot } from "@/lib/fetch-configuration-directory";

export async function refreshConfigurationDirectorySnapshot() {
  const supabase = await createClient();
  const scope = await fetchAllowedDepartmentForSession(supabase);
  return fetchConfigurationDirectorySnapshot(supabase, {
    departmentTitleScope: scope,
  });
}
