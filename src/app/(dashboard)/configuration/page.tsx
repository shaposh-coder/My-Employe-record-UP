import { createClient } from "@/lib/supabase/server";
import { DepartmentSectionSettings } from "@/components/configuration/department-section-settings";
import { fetchConfigurationDirectorySnapshot } from "@/lib/fetch-configuration-directory";

export default async function ConfigurationPage() {
  const supabase = await createClient();
  const snap = await fetchConfigurationDirectorySnapshot(supabase);

  return (
    <DepartmentSectionSettings
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
