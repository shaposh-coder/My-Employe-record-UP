import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { createClient } from "@/lib/supabase/server";
import { fetchAllowedDepartmentForSession } from "@/lib/fetch-allowed-department-for-session";
import { fetchDepartmentsSectionsForEmployeeForm } from "@/lib/fetch-form-departments-sections";

export default async function NewEmployeePage() {
  const supabase = await createClient();
  const allowedDepartment = await fetchAllowedDepartmentForSession(supabase);
  const formOpts = await fetchDepartmentsSectionsForEmployeeForm(supabase, {
    lockDepartmentTitle: allowedDepartment,
  });

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-5xl flex-1 flex-col">
      <AddEmployeeForm
        initialDepartments={formOpts.departments}
        initialSections={formOpts.sections}
        initialConfigError={formOpts.error}
        lockedDepartmentTitle={allowedDepartment}
      />
    </div>
  );
}
