import type { SocialLinksRecord } from "@/lib/social-links";

/** Row shape for the employees directory table and fetches. */
export type EmployeeListRow = {
  id: string;
  /** Profile photo URL (Documents tab) */
  profile_image: string | null;
  full_name: string;
  father_name: string | null;
  dob: string | null;
  cnic_no: string;
  ss_eubi_no: string | null;
  /** Optional — Personal tab */
  basic_salary: string | null;
  phone_no: string | null;
  city: string | null;
  department: string;
  section: string | null;
  /** Work & education tab — YYYY-MM-DD or empty */
  date_of_joining: string | null;
  date_of_resign: string | null;
  designation: string | null;
  education: string | null;
  address: string | null;
  experience: string | null;
  social_media_link: string | null;
  social_links: SocialLinksRecord | null;
  email_address: string | null;
  reference_info: string | null;
  family_name: string | null;
  family_father_name: string | null;
  family_cnic: string | null;
  family_phone: string | null;
  family_phone_alt: string | null;
  /** Active or Un-Active — from Add Employee form */
  status: string | null;
};
