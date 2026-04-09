import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { createClient } from "@/lib/supabase/server";
import { fetchDepartmentsSectionsForEmployeeForm } from "@/lib/fetch-form-departments-sections";

export default async function NewEmployeePage() {
  const supabase = await createClient();
  const formOpts = await fetchDepartmentsSectionsForEmployeeForm(supabase);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl pb-16">
      <AddEmployeeForm
        initialDepartments={formOpts.departments}
        initialSections={formOpts.sections}
        initialConfigError={formOpts.error}
      />
    </div>
  );
}
