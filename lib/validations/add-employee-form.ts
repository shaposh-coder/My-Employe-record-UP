import { z } from "zod";

const optionalText = z.string().optional();

export const addEmployeeSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200),
  status: z.enum(["Active", "Deactive"]),
  father_name: z.string().min(1, "Father’s name is required").max(200),
  dob: z.string().min(1, "Date of birth is required"),
  cnic_no: z.string().min(1, "CNIC is required").max(64),
  ss_eubi_no: optionalText,
  phone_no: z.string().min(1, "Phone number is required").max(64),
  city: z.string().min(1, "City is required").max(120),
  address: z.string().min(1, "Address is required").max(1000),
  department: z.string().min(1, "Department is required").max(120),
  section: z.string().min(1, "Section is required").max(120),
  education: optionalText,
  experience: optionalText,
  social_instagram: optionalText,
  social_facebook: optionalText,
  social_tiktok: optionalText,
  social_youtube: optionalText,
  social_snapchat: optionalText,
  social_twitter: optionalText,
  email_address: z
    .string()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Enter a valid email address",
    ),
  reference_info: optionalText,
  family_father_name: z
    .string()
    .min(1, "Father name is required")
    .max(200),
  family_cnic: optionalText,
  family_phone: z.string().min(1, "Father phone is required").max(64),
  family_phone_alt: optionalText,
  profile_image: z.string().min(1, "Upload profile photo"),
  cnic_front: optionalText,
  cnic_back: optionalText,
  father_image: optionalText,
  father_cnic_front: optionalText,
  father_cnic_back: optionalText,
  additional_document: optionalText,
});

export type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;
