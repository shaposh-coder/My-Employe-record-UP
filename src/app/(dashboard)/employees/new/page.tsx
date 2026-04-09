import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { createClient } from "@/lib/supabase/server";
import { fetchDepartmentsSectionsForEmployeeForm } from "@/lib/fetch-form-departments-sections";

export default async function NewEmployeePage() {
  const supabase = await createClient();
  const formOpts = await fetchDepartmentsSectionsForEmployeeForm(supabase);

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-5xl flex-1 flex-col">
      <AddEmployeeForm
        initialDepartments={formOpts.departments}
        initialSections={formOpts.sections}
        initialConfigError={formOpts.error}
      />
    </div>
  );
}
