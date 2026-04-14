import { createClient } from "@/lib/supabase/server";
import { DepartmentSectionSettings } from "@/components/configuration/department-section-settings";
import { fetchAllowedDepartmentForSession } from "@/lib/fetch-allowed-department-for-session";
import { fetchConfigurationDirectorySnapshot } from "@/lib/fetch-configuration-directory";

export default async function ConfigurationPage() {
  const supabase = await createClient();
  const scope = await fetchAllowedDepartmentForSession(supabase);
  const snap = await fetchConfigurationDirectorySnapshot(supabase, {
    departmentTitleScope: scope,
  });

  return (
    <DepartmentSectionSettings
      configurationDepartmentScope={scope}
      initialSnapshot={{
        departments: snap.departments,
        sections: snap.sections,
        deptCounts: snap.deptCounts,
        secCounts: snap.secCounts,
        error: snap.error,
      }}
    />
  );
}
