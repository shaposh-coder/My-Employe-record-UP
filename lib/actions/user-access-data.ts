"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchUserAccessRows } from "@/lib/user-access";

export async function loadUserAccessRowsServer() {
  const supabase = await createClient();
  return fetchUserAccessRows(supabase);
}
