"use client";

import { useMemo, useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import {
  employeeFormSchema,
  stepSchemas,
  type EmployeeFormValues,
} from "@/lib/validations/employee-form";
import { createClient } from "@/lib/supabase/client";
import { uploadEmployeeDocument } from "@/lib/storage/upload-employee-doc";
import { FileUploadField } from "./file-upload-field";

const defaultValues: EmployeeFormValues = {
  full_name: "",
  cnic_no: "",
  department: "",
  profile_image: "",
  cnic_front: "",
  cnic_back: "",
  father_image: "",
  father_cnic_front: "",
  father_cnic_back: "",
};

const STEPS = [
  {
    title: "Personal details",
    subtitle: "Legal name, CNIC / ID number, and department",
  },
  {
    title: "Identity documents",
    subtitle: "Profile photo and national ID (front and back)",
  },
  {
    title: "Family information",
    subtitle: "Father’s photo and ID documents",
  },
] as const;

type UploadFieldKey =
  | "profile_image"
  | "cnic_front"
  | "cnic_back"
  | "father_image"
  | "father_cnic_front"
  | "father_cnic_back";

const UPLOAD_SLUGS: Record<UploadFieldKey, string> = {
  profile_image: "profile",
  cnic_front: "cnic-front",
  cnic_back: "cnic-back",
  father_image: "father-photo",
  father_cnic_front: "father-cnic-front",
  father_cnic_back: "father-cnic-back",
};

function applyZodErrors(
  error: z.ZodError,
  setError: UseFormSetError<EmployeeFormValues>,
) {
  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path === "string") {
      setError(path as keyof EmployeeFormValues, { message: issue.message });
    }
  }
}

export function NewEmployeeForm() {
  const router = useRouter();
  const draftId = useMemo(() => crypto.randomUUID(), []);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState<Partial<Record<UploadFieldKey, boolean>>>(
    {},
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    defaultValues,
  });

  const values = watch();

  async function handleUpload(field: UploadFieldKey, file: File) {
    setUploadError(null);
    setUploading((u) => ({ ...u, [field]: true }));
    try {
      const supabase = createClient();
      const url = await uploadEmployeeDocument(supabase, {
        draftId,
        slug: UPLOAD_SLUGS[field],
        file,
      });
      setValue(field, url, { shouldDirty: true });
      clearErrors(field);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setUploadError(msg);
      setError(field, { message: "Upload failed. Try again." });
    } finally {
      setUploading((u) => ({ ...u, [field]: false }));
    }
  }

  async function goNext() {
    setSubmitError(null);
    const schema = stepSchemas[step];
    const parsed = schema.safeParse(getValues());
    if (!parsed.success) {
      applyZodErrors(parsed.error, setError);
      return;
    }
    clearErrors();
    setStep((s) => s + 1);
  }

  function goPrev() {
    setSubmitError(null);
    clearErrors();
    setStep((s) => Math.max(0, s - 1));
  }

  async function onSubmit(values: EmployeeFormValues) {
    setSubmitError(null);
    const parsed = employeeFormSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(parsed.error, setError);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("employees").insert({
        full_name: parsed.data.full_name,
        cnic_no: parsed.data.cnic_no,
        department: parsed.data.department,
        profile_image: parsed.data.profile_image,
        cnic_front: parsed.data.cnic_front,
        cnic_back: parsed.data.cnic_back,
        father_image: parsed.data.father_image,
        father_cnic_front: parsed.data.father_cnic_front,
        father_cnic_back: parsed.data.father_cnic_back,
        other_documents: [],
      });

      if (error) {
        if (error.code === "23505") {
          setSubmitError("This CNIC / ID number is already registered.");
          setError("cnic_no", { message: "Already in use" });
        } else {
          setSubmitError(error.message);
        }
        return;
      }

      router.push("/employees");
      router.refresh();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const progressPct = ((step + 1) / STEPS.length) * 100;

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

  const secondaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        if (step < STEPS.length - 1) {
          e.preventDefault();
        } else {
          handleSubmit(onSubmit)(e);
        }
      }}
    >
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {STEPS[step].title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{STEPS[step].subtitle}</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-label="Form progress"
          />
        </div>
      </div>

      {uploadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {uploadError}
        </p>
      ) : null}

      {submitError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {submitError}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 ? (
          <div className="grid gap-5 sm:grid-cols-1">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-slate-800"
              >
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
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.full_name.message}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="cnic_no"
                className="block text-sm font-medium text-slate-800"
              >
                CNIC / ID number
              </label>
              <input
                id="cnic_no"
                type="text"
                autoComplete="off"
                className={inputClass}
                {...register("cnic_no")}
              />
              {errors.cnic_no ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.cnic_no.message}
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium text-slate-800"
              >
                Department
              </label>
              <input
                id="department"
                type="text"
                autoComplete="organization-title"
                className={inputClass}
                {...register("department")}
              />
              {errors.department ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.department.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-6">
            <FileUploadField
              id="profile_image"
              label="Profile image"
              description="A clear head-and-shoulders photo."
              value={values.profile_image}
              error={errors.profile_image?.message}
              uploading={!!uploading.profile_image}
              onFileSelect={(file) => handleUpload("profile_image", file)}
            />
            <FileUploadField
              id="cnic_front"
              label="CNIC — front"
              value={values.cnic_front}
              error={errors.cnic_front?.message}
              uploading={!!uploading.cnic_front}
              onFileSelect={(file) => handleUpload("cnic_front", file)}
            />
            <FileUploadField
              id="cnic_back"
              label="CNIC — back"
              value={values.cnic_back}
              error={errors.cnic_back?.message}
              uploading={!!uploading.cnic_back}
              onFileSelect={(file) => handleUpload("cnic_back", file)}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-6">
            <FileUploadField
              id="father_image"
              label="Father’s photo"
              description="Portrait or clear identification photo."
              value={values.father_image}
              error={errors.father_image?.message}
              uploading={!!uploading.father_image}
              onFileSelect={(file) => handleUpload("father_image", file)}
            />
            <FileUploadField
              id="father_cnic_front"
              label="Father’s CNIC — front"
              value={values.father_cnic_front}
              error={errors.father_cnic_front?.message}
              uploading={!!uploading.father_cnic_front}
              onFileSelect={(file) => handleUpload("father_cnic_front", file)}
            />
            <FileUploadField
              id="father_cnic_back"
              label="Father’s CNIC — back"
              value={values.father_cnic_back}
              error={errors.father_cnic_back?.message}
              uploading={!!uploading.father_cnic_back}
              onFileSelect={(file) => handleUpload("father_cnic_back", file)}
            />
          </div>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className={secondaryBtn}
            onClick={goPrev}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Previous
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" className={primaryBtn} onClick={() => void goNext()}>
              Next
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : (
            <button type="submit" className={primaryBtn} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Save employee
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
