import { createClient } from "@/lib/supabase/client";

/** Full `employees` row for detail view (all columns). */
export async function fetchEmployeeFullById(id: string): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as Record<string, unknown>, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Could not load employee",
    };
  }
}
