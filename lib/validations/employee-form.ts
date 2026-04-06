import { z } from "zod";

export const step1Schema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(200, "Name is too long"),
  cnic_no: z
    .string()
    .min(1, "CNIC / ID number is required")
    .max(64, "CNIC / ID is too long"),
  department: z
    .string()
    .min(1, "Department is required")
    .max(120, "Department name is too long"),
});

export const step2Schema = z.object({
  profile_image: z.string().min(1, "Please upload a profile photo"),
  cnic_front: z.string().min(1, "Please upload the front of your CNIC"),
  cnic_back: z.string().min(1, "Please upload the back of your CNIC"),
});

export const step3Schema = z.object({
  father_image: z.string().min(1, "Please upload a photo"),
  father_cnic_front: z.string().min(1, "Please upload the front of the CNIC"),
  father_cnic_back: z.string().min(1, "Please upload the back of the CNIC"),
});

export const employeeFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema);

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const stepSchemas = [step1Schema, step2Schema, step3Schema] as const;
