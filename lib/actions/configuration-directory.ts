"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchConfigurationDirectorySnapshot } from "@/lib/fetch-configuration-directory";

export async function refreshConfigurationDirectorySnapshot() {
  const supabase = await createClient();
  return fetchConfigurationDirectorySnapshot(supabase);
}
