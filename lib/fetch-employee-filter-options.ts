import { createClient } from "@/lib/supabase/client";

/** Distinct department / section / city values for directory filters. */
export async function fetchEmployeeFilterOptions(): Promise<{
  departments: string[];
  sections: string[];
  cities: string[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("department, section, city");
    if (error) {
      return { departments: [], sections: [], cities: [], error: error.message };
    }
    if (!data?.length) {
      return { departments: [], sections: [], cities: [], error: null };
    }
    const departments = [
      ...new Set(
        data
          .map((r) => r.department)
          .filter((v): v is string => typeof v === "string" && v.trim() !== ""),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const sections = [
      ...new Set(
        data
          .map((r) => r.section)
          .filter((v): v is string => typeof v === "string" && v.trim() !== ""),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const cities = [
      ...new Set(
        data
          .map((r) => r.city)
          .filter((v): v is string => typeof v === "string" && v.trim() !== ""),
      ),
    ].sort((a, b) => a.localeCompare(b));
    return { departments, sections, cities, error: null };
  } catch (e) {
    return {
      departments: [],
      sections: [],
      cities: [],
      error: e instanceof Error ? e.message : "Could not load filter options",
    };
  }
}
