"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  addEmployeeSchema,
  type AddEmployeeFormValues,
} from "@/lib/validations/add-employee-form";
import { createClient } from "@/lib/supabase/client";
import { EmployeeDocUploadField } from "./employee-doc-upload-field";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const defaultValues: AddEmployeeFormValues = {
  full_name: "",
  father_name: "",
  dob: "",
  cnic_no: "",
  ss_eubi_no: "",
  phone_no: "",
  address: "",
  department: "",
  section: "",
  education: "",
  experience: "",
  social_media_link: "",
  email_address: "",
  reference_info: "",
  family_name: "",
  family_father_name: "",
  family_cnic: "",
  family_phone: "",
  profile_image: "",
  cnic_front: "",
  cnic_back: "",
  father_image: "",
  father_cnic_front: "",
  father_cnic_back: "",
  additional_document: "",
};

type DocFieldKey =
  | "profile_image"
  | "cnic_front"
  | "cnic_back"
  | "father_image"
  | "father_cnic_front"
  | "father_cnic_back"
  | "additional_document";

const DOC_SLUGS: Record<DocFieldKey, string> = {
  profile_image: "profile",
  cnic_front: "cnic-front",
  cnic_back: "cnic-back",
  father_image: "father-photo",
  father_cnic_front: "father-cnic-front",
  father_cnic_back: "father-cnic-back",
  additional_document: "additional-doc",
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)] sm:p-10">
      <header className="mb-8 border-b border-slate-100 pb-6 dark:border-slate-800">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

const labelClass =
  "block text-sm font-medium text-slate-800 dark:text-slate-200";
const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.08] dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20";
const errorClass = "mt-1.5 text-sm text-red-600 dark:text-red-400";

export function AddEmployeeForm() {
  const router = useRouter();
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues,
  });

  const values = watch();

  function docFolder(field: DocFieldKey) {
    return `drafts/${draftId}/${DOC_SLUGS[field]}`;
  }

  function onDocUploaded(field: DocFieldKey, url: string) {
    setValue(field, url, { shouldDirty: true, shouldValidate: true });
    clearErrors(field);
  }

  async function onSubmit(data: AddEmployeeFormValues) {
    setSubmitError(null);
    const supabase = createClient();

    const other_documents =
      data.additional_document?.trim()
        ? [
            {
              url: data.additional_document.trim(),
              label: "Additional document",
            },
          ]
        : [];

    const { error } = await supabase.from("employees").insert({
      full_name: data.full_name,
      father_name: data.father_name || null,
      dob: data.dob || null,
      cnic_no: data.cnic_no,
      ss_eubi_no: data.ss_eubi_no || null,
      phone_no: data.phone_no || null,
      address: data.address || null,
      department: data.department,
      section: data.section || null,
      education: data.education || null,
      experience: data.experience || null,
      social_media_link: data.social_media_link || null,
      email_address: data.email_address || null,
      reference_info: data.reference_info || null,
      family_name: data.family_name || null,
      family_father_name: data.family_father_name || null,
      family_cnic: data.family_cnic || null,
      family_phone: data.family_phone || null,
      profile_image: data.profile_image,
      cnic_front: data.cnic_front,
      cnic_back: data.cnic_back,
      father_image: data.father_image,
      father_cnic_front: data.father_cnic_front,
      father_cnic_back: data.father_cnic_back,
      other_documents,
    });

    if (error) {
      if (error.code === "23505") {
        const msg = "This CNIC number is already registered.";
        setSubmitError(msg);
        setError("cnic_no", { message: "Already registered" });
        toast.error("Could not save employee", { description: msg });
      } else {
        setSubmitError(error.message);
        toast.error("Could not save employee", {
          description: error.message,
        });
      }
      return;
    }

    toast.success("Employee added successfully", {
      description: `${data.full_name} has been saved to the directory.`,
      duration: 4500,
    });

    reset(defaultValues);
    clearErrors();
    setSubmitError(null);
    setDraftId(crypto.randomUUID());

    router.push("/employees");
    router.refresh();
  }

  return (
    <div
      className={`${inter.className} space-y-12 text-slate-900 antialiased dark:text-slate-100`}
    >
      {submitError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {submitError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <SectionCard
          title="Personal information"
          description="Legal identity and contact basics for this employee record."
        >
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="full_name" className={labelClass}>
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                className={inputClass}
                {...register("full_name")}
              />
              {errors.full_name ? (
                <p className={errorClass} role="alert">
                  {errors.full_name.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="father_name" className={labelClass}>
                Father’s name
              </label>
              <input
                id="father_name"
                type="text"
                className={inputClass}
                {...register("father_name")}
              />
            </div>
            <div>
              <label htmlFor="dob" className={labelClass}>
                Date of birth
              </label>
              <input
                id="dob"
                type="date"
                className={inputClass}
                {...register("dob")}
              />
            </div>
            <div>
              <label htmlFor="cnic_no" className={labelClass}>
                CNIC / national ID
              </label>
              <input
                id="cnic_no"
                type="text"
                autoComplete="off"
                className={inputClass}
                {...register("cnic_no")}
              />
              {errors.cnic_no ? (
                <p className={errorClass} role="alert">
                  {errors.cnic_no.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="ss_eubi_no" className={labelClass}>
                SS / EUBI number
              </label>
              <input
                id="ss_eubi_no"
                type="text"
                className={inputClass}
                {...register("ss_eubi_no")}
              />
            </div>
            <div>
              <label htmlFor="phone_no" className={labelClass}>
                Phone number
              </label>
              <input
                id="phone_no"
                type="tel"
                autoComplete="tel"
                className={inputClass}
                {...register("phone_no")}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className={labelClass}>
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                className={`${inputClass} resize-y`}
                {...register("address")}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Work & education"
          description="Department, role context, and professional background."
        >
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div>
              <label htmlFor="department" className={labelClass}>
                Department
              </label>
              <input
                id="department"
                type="text"
                className={inputClass}
                {...register("department")}
              />
              {errors.department ? (
                <p className={errorClass} role="alert">
                  {errors.department.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="section" className={labelClass}>
                Section
              </label>
              <input
                id="section"
                type="text"
                className={inputClass}
                {...register("section")}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="education" className={labelClass}>
                Education
              </label>
              <textarea
                id="education"
                rows={3}
                className={`${inputClass} resize-y`}
                {...register("education")}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="experience" className={labelClass}>
                Experience
              </label>
              <textarea
                id="experience"
                rows={3}
                className={`${inputClass} resize-y`}
                {...register("experience")}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Social & reference"
          description="Optional links and reference notes for verification."
        >
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="social_media_link" className={labelClass}>
                Social media link
              </label>
              <input
                id="social_media_link"
                type="url"
                placeholder="https://"
                className={inputClass}
                {...register("social_media_link")}
              />
            </div>
            <div>
              <label htmlFor="email_address" className={labelClass}>
                Email address
              </label>
              <input
                id="email_address"
                type="email"
                autoComplete="email"
                className={inputClass}
                {...register("email_address")}
              />
              {errors.email_address ? (
                <p className={errorClass} role="alert">
                  {errors.email_address.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="reference_info" className={labelClass}>
                Reference information
              </label>
              <textarea
                id="reference_info"
                rows={4}
                className={`${inputClass} resize-y`}
                placeholder="Name, relationship, contact details…"
                {...register("reference_info")}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Family details"
          description="Next of kin or family contact on record."
        >
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div>
              <label htmlFor="family_name" className={labelClass}>
                Family name
              </label>
              <input
                id="family_name"
                type="text"
                className={inputClass}
                {...register("family_name")}
              />
            </div>
            <div>
              <label htmlFor="family_father_name" className={labelClass}>
                Father’s name (family)
              </label>
              <input
                id="family_father_name"
                type="text"
                className={inputClass}
                {...register("family_father_name")}
              />
            </div>
            <div>
              <label htmlFor="family_cnic" className={labelClass}>
                Family CNIC
              </label>
              <input
                id="family_cnic"
                type="text"
                className={inputClass}
                {...register("family_cnic")}
              />
            </div>
            <div>
              <label htmlFor="family_phone" className={labelClass}>
                Family phone
              </label>
              <input
                id="family_phone"
                type="tel"
                className={inputClass}
                {...register("family_phone")}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Document uploads"
          description="Images are uploaded to secure storage when selected. Thumbnails appear after upload."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
              <EmployeeDocUploadField
                id="profile_image"
                label="Profile photo"
                description="Head-and-shoulders, neutral background."
                folderPath={docFolder("profile_image")}
                value={values.profile_image}
                validationError={errors.profile_image?.message}
                onUploaded={(url) => onDocUploaded("profile_image", url)}
              />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
              <EmployeeDocUploadField
                id="cnic_front"
                label="CNIC — front"
                folderPath={docFolder("cnic_front")}
                value={values.cnic_front}
                validationError={errors.cnic_front?.message}
                onUploaded={(url) => onDocUploaded("cnic_front", url)}
              />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
              <EmployeeDocUploadField
                id="cnic_back"
                label="CNIC — back"
                folderPath={docFolder("cnic_back")}
                value={values.cnic_back}
                validationError={errors.cnic_back?.message}
                onUploaded={(url) => onDocUploaded("cnic_back", url)}
              />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
              <EmployeeDocUploadField
                id="father_image"
                label="Father’s photo"
                folderPath={docFolder("father_image")}
                value={values.father_image}
                validationError={errors.father_image?.message}
                onUploaded={(url) => onDocUploaded("father_image", url)}
              />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
              <EmployeeDocUploadField
                id="father_cnic_front"
                label="Father’s CNIC — front"
                folderPath={docFolder("father_cnic_front")}
                value={values.father_cnic_front}
                validationError={errors.father_cnic_front?.message}
                onUploaded={(url) => onDocUploaded("father_cnic_front", url)}
              />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
              <EmployeeDocUploadField
                id="father_cnic_back"
                label="Father’s CNIC — back"
                folderPath={docFolder("father_cnic_back")}
                value={values.father_cnic_back}
                validationError={errors.father_cnic_back?.message}
                onUploaded={(url) => onDocUploaded("father_cnic_back", url)}
              />
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50 sm:col-span-2 lg:col-span-1">
              <EmployeeDocUploadField
                id="additional_document"
                label="Additional document (optional)"
                description="Any extra supporting image."
                folderPath={docFolder("additional_document")}
                value={values.additional_document}
                validationError={errors.additional_document?.message}
                onUploaded={(url) => onDocUploaded("additional_document", url)}
              />
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end border-t border-slate-200/80 pt-8 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Save employee
          </button>
        </div>
      </form>
    </div>
  );
}
