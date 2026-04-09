import type { SupabaseClient } from "@supabase/supabase-js";

function mapTitles(
  rows: { title: string | null }[] | null,
): string[] {
  if (!rows?.length) return [];
  const set = new Set<string>();
  for (const r of rows) {
    const t = typeof r.title === "string" ? r.title.trim() : "";
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Directory filter dropdowns: departments and sections from configuration tables
 * (not a full scan of `employees`). Cities from DB RPC `get_employee_distinct_cities`
 * (indexed distinct scan). Falls back to empty cities if RPC is missing.
 */
export async function fetchEmployeeFilterOptions(
  supabase: SupabaseClient,
): Promise<{
  departments: string[];
  sections: string[];
  cities: string[];
  error: string | null;
}> {
  try {
    const [dRes, sRes, cityRes] = await Promise.all([
      supabase.from("departments").select("title").order("title"),
      supabase.from("sections").select("title").order("title"),
      supabase.rpc("get_employee_distinct_cities"),
    ]);

    if (dRes.error) {
      return {
        departments: [],
        sections: [],
        cities: [],
        error: dRes.error.message,
      };
    }
    if (sRes.error) {
      return {
        departments: [],
        sections: [],
        cities: [],
        error: sRes.error.message,
      };
    }

    const departments = mapTitles(dRes.data as { title: string | null }[]);
    const sections = mapTitles(sRes.data as { title: string | null }[]);

    let cities: string[] = [];
    if (cityRes.error) {
      // RPC not deployed yet — optional legacy path (avoid loading all rows in production).
      cities = [];
    } else {
      const raw = cityRes.data as unknown;
      if (Array.isArray(raw)) {
        cities = raw
          .map((row) => {
            if (row && typeof row === "object" && "city" in row) {
              return String((row as { city: string }).city ?? "").trim();
            }
            if (typeof row === "string") return row.trim();
            return "";
          })
          .filter(Boolean);
        cities = [...new Set(cities)].sort((a, b) => a.localeCompare(b));
      }
    }

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
