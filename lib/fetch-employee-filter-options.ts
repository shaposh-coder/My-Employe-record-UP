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

async function loadCities(
  supabase: SupabaseClient,
): Promise<{ cities: string[]; error: string | null }> {
  const cityRes = await supabase.rpc("get_employee_distinct_cities");
  if (cityRes.error) {
    return { cities: [], error: null };
  }
  const raw = cityRes.data as unknown;
  if (!Array.isArray(raw)) {
    return { cities: [], error: null };
  }
  const cities = raw
    .map((row) => {
      if (row && typeof row === "object" && "city" in row) {
        return String((row as { city: string }).city ?? "").trim();
      }
      if (typeof row === "string") return row.trim();
      return "";
    })
    .filter(Boolean);
  return {
    cities: [...new Set(cities)].sort((a, b) => a.localeCompare(b)),
    error: null,
  };
}

/**
 * Directory filter dropdowns: departments and sections from configuration tables
 * (not a full scan of `employees`). Cities from DB RPC `get_employee_distinct_cities`
 * (indexed distinct scan). Falls back to empty cities if RPC is missing.
 */
export async function fetchEmployeeFilterOptions(
  supabase: SupabaseClient,
  options?: { departmentScope?: string | null },
): Promise<{
  departments: string[];
  sections: string[];
  cities: string[];
  error: string | null;
}> {
  try {
    const scope = options?.departmentScope?.trim();

    if (scope) {
      const dr = await supabase
        .from("departments")
        .select("id, title")
        .eq("title", scope)
        .limit(1);
      if (dr.error) {
        return {
          departments: [],
          sections: [],
          cities: [],
          error: dr.error.message,
        };
      }
      let departments: string[] = [];
      let sections: string[] = [];
      if (dr.data?.length) {
        const row = dr.data[0] as { id: string; title: string };
        if (row.title?.trim()) departments = [row.title.trim()];
        const sr = await supabase
          .from("sections")
          .select("title")
          .eq("department_id", row.id)
          .order("title");
        if (sr.error) {
          return {
            departments: [],
            sections: [],
            cities: [],
            error: sr.error.message,
          };
        }
        sections = mapTitles(sr.data as { title: string | null }[]);
      }
      const { cities } = await loadCities(supabase);
      return { departments, sections, cities, error: null };
    }

    const [dRes, sRes, cityPack] = await Promise.all([
      supabase.from("departments").select("title").order("title"),
      supabase.from("sections").select("title").order("title"),
      loadCities(supabase),
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

    return {
      departments,
      sections,
      cities: cityPack.cities,
      error: null,
    };
  } catch (e) {
    return {
      departments: [],
      sections: [],
      cities: [],
      error: e instanceof Error ? e.message : "Could not load filter options",
    };
  }
}
