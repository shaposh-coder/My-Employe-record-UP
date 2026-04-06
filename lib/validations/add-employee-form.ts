import { z } from "zod";

const optionalText = z.string().optional();

export const addEmployeeSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200),
  father_name: optionalText,
  dob: optionalText,
  cnic_no: z.string().min(1, "CNIC is required").max(64),
  ss_eubi_no: optionalText,
  phone_no: optionalText,
  address: optionalText,
  department: z.string().min(1, "Department is required").max(120),
  section: optionalText,
  education: optionalText,
  experience: optionalText,
  social_media_link: optionalText,
  email_address: z
    .string()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Enter a valid email address",
    ),
  reference_info: optionalText,
  family_name: optionalText,
  family_father_name: optionalText,
  family_cnic: optionalText,
  family_phone: optionalText,
  profile_image: z.string().min(1, "Upload profile photo"),
  cnic_front: z.string().min(1, "Upload CNIC front"),
  cnic_back: z.string().min(1, "Upload CNIC back"),
  father_image: z.string().min(1, "Upload father’s photo"),
  father_cnic_front: z.string().min(1, "Upload father’s CNIC front"),
  father_cnic_back: z.string().min(1, "Upload father’s CNIC back"),
  additional_document: optionalText,
});

export type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;
