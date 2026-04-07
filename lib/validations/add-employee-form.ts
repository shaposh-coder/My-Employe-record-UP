import { z } from "zod";
import { CNIC_FORMAT_REGEX, PHONE_FORMAT_REGEX } from "@/lib/format-cnic-phone";

const optionalText = z.string().optional();

const cnicField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(
      CNIC_FORMAT_REGEX,
      "Use format 33203-1234567-5 (complete 13 digits)",
    );

const phoneField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(
      PHONE_FORMAT_REGEX,
      "Use format 0305-1234567 (11 digits)",
    );

const optionalCnic = z
  .string()
  .refine(
    (v) => v.trim() === "" || CNIC_FORMAT_REGEX.test(v.trim()),
    "Use format 33203-1234567-5 (complete 13 digits)",
  );

const optionalPhone = z
  .string()
  .refine(
    (v) => v.trim() === "" || PHONE_FORMAT_REGEX.test(v.trim()),
    "Use format 0305-1234567 (11 digits)",
  );

export const addEmployeeSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200),
  status: z.enum(["Active", "Un-Active"]),
  father_name: z.string().min(1, "Father’s name is required").max(200),
  dob: z.string().min(1, "Date of birth is required"),
  cnic_no: cnicField("CNIC / national ID"),
  ss_eubi_no: optionalText,
  phone_no: phoneField("Phone number"),
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
  family_cnic: optionalCnic,
  family_phone: phoneField("Father phone (main)"),
  family_phone_alt: optionalPhone,
  profile_image: z.string().min(1, "Upload profile photo"),
  cnic_front: optionalText,
  cnic_back: optionalText,
  father_image: optionalText,
  father_cnic_front: optionalText,
  father_cnic_back: optionalText,
  additional_document: optionalText,
});

export type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;
