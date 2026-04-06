import { AddEmployeeForm } from "@/components/employees/add-employee-form";

export default function NewEmployeePage() {
  return (
    <div className="mx-auto max-w-5xl pb-16">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Add new employee
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Complete all sections below. Required fields are validated on save;
          document images upload to storage when you choose a file.
        </p>
      </div>
      <AddEmployeeForm />
    </div>
  );
}
