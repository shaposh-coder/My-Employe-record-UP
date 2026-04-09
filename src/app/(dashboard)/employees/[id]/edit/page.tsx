import { notFound } from "next/navigation";
import { AddEmployeeForm } from "@/components/employees/add-employee-form";
import { createClient } from "@/lib/supabase/server";
import { employeeDbRowToFormValues } from "@/lib/employee-db-row-to-form-values";
import { fetchDepartmentsSectionsForEmployeeForm } from "@/lib/fetch-form-departments-sections";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEmployeePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const initialEmployee = employeeDbRowToFormValues(
    data as Record<string, unknown>,
  );
  const formOpts = await fetchDepartmentsSectionsForEmployeeForm(supabase);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <AddEmployeeForm
        editEmployeeId={id}
        initialEmployee={initialEmployee}
        initialDepartments={formOpts.departments}
        initialSections={formOpts.sections}
        initialConfigError={formOpts.error}
      />
    </div>
  );
}
