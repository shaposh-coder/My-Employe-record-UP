import { AddEmployeeForm } from "@/components/employees/add-employee-form";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl pb-16">
      <AddEmployeeForm editEmployeeId={id} />
    </div>
  );
}
