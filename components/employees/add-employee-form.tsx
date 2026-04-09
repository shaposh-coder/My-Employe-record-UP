"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  addEmployeeSchema,
  type AddEmployeeFormValues,
} from "@/lib/validations/add-employee-form";
import { createClient } from "@/lib/supabase/client";
import { AddEmployeeFormSkeleton } from "./add-employee-form-skeleton";
import { EmployeeDocUploadField } from "./employee-doc-upload-field";
import { SearchableCombobox } from "./searchable-combobox";
import { SocialPlatformIcon } from "./social-platform-icons";
import { normalizeSocialLinksForDb } from "@/lib/social-links";
import type { SocialLinkKey } from "@/lib/social-links";
import {
  CNIC_FORMAT_REGEX,
  formatCnicInput,
  formatPhoneInput,
} from "@/lib/format-cnic-phone";
import { employeeDbRowToFormValues } from "@/lib/employee-db-row-to-form-values";
import { PAKISTAN_CITIES } from "@/lib/pakistan-cities";
import type {
  FormDepartmentOptionRow,
  FormSectionOptionRow,
} from "@/lib/fetch-form-departments-sections";
import {
  DUPLICATE_MSG,
  isEmployeeCnicTaken,
} from "@/lib/check-cnic-duplicate";
import { EMPLOYEE_STATUS } from "@/lib/employee-status";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const defaultValues: AddEmployeeFormValues = {
  full_name: "",
  status: "Active",
  father_name: "",
  dob: "",
  cnic_no: "",
  ss_eubi_no: "",
  basic_salary: "",
  phone_no: "",
  city: "",
  address: "",
  department: "",
  section: "",
  education: "",
  experience: "",
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
  social_youtube: "",
  social_snapchat: "",
  social_twitter: "",
  email_address: "",
  reference_info: "",
  family_cnic: "",
  family_phone: "",
  family_phone_alt: "",
  profile_image: "",
  cnic_front: "",
  cnic_back: "",
  father_image: "",
  father_cnic_front: "",
  father_cnic_back: "",
  additional_document: "",
};

const TABS = [
  { id: "personal", label: "Personal" },
  { id: "work", label: "Work & education" },
  { id: "social", label: "Social & reference" },
  { id: "family", label: "Family" },
  { id: "documents", label: "Documents" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type ConfigOptionRow = { id: string; title: string };

type SectionOptionRow = ConfigOptionRow & { department_id: string };

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

const labelClass =
  "block text-sm font-medium text-slate-800 dark:text-slate-200";
const inputClass =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/[0.08] dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-400/20";
const errorClass = "mt-1.5 text-sm text-red-600 dark:text-red-400";

function ReqStar() {
  return (
    <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden="true">
      *
    </span>
  );
}

const tabOrder = TABS.map((t) => t.id);

const SOCIAL_PLATFORM_FIELDS: {
  key: SocialLinkKey;
  name:
    | "social_instagram"
    | "social_facebook"
    | "social_tiktok"
    | "social_youtube"
    | "social_snapchat"
    | "social_twitter";
  label: string;
}[] = [
  { key: "instagram", name: "social_instagram", label: "Instagram" },
  { key: "facebook", name: "social_facebook", label: "Facebook" },
  { key: "tiktok", name: "social_tiktok", label: "TikTok" },
  { key: "youtube", name: "social_youtube", label: "YouTube" },
  { key: "snapchat", name: "social_snapchat", label: "Snapchat" },
  { key: "twitter", name: "social_twitter", label: "Twitter" },
];

type AddEmployeeFormProps = {
  editEmployeeId?: string;
  /** Prefetched on the edit route so the form renders with data immediately (no client fetch). */
  initialEmployee?: AddEmployeeFormValues;
  /** From server on /employees/new and /edit — avoids client round-trip for combobox options. */
  initialDepartments?: FormDepartmentOptionRow[];
  initialSections?: FormSectionOptionRow[];
  initialConfigError?: string | null;
};

export function AddEmployeeForm({
  editEmployeeId,
  initialEmployee,
  initialDepartments,
  initialSections,
  initialConfigError,
}: AddEmployeeFormProps) {
  const router = useRouter();
  const [loadingEmployee, setLoadingEmployee] = useState(() =>
    Boolean(editEmployeeId && !initialEmployee),
  );
  const [draftId, setDraftId] = useState(() => editEmployeeId ?? crypto.randomUUID());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const serverOptionsOk =
    initialDepartments !== undefined &&
    initialSections !== undefined &&
    !initialConfigError;
  const [departments, setDepartments] = useState<ConfigOptionRow[]>(
    () => initialDepartments ?? [],
  );
  const [sections, setSections] = useState<SectionOptionRow[]>(
    () => initialSections ?? [],
  );
  const [configLoading, setConfigLoading] = useState(() => !serverOptionsOk);
  const [configError, setConfigError] = useState<string | null>(
    () => initialConfigError ?? null,
  );

  const formDefaultValues = useMemo(
    () =>
      editEmployeeId && initialEmployee
        ? { ...defaultValues, ...initialEmployee }
        : defaultValues,
    [editEmployeeId, initialEmployee],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: formDefaultValues,
  });

  const values = watch();
  const fatherName = watch("father_name");
  const cnicNo = watch("cnic_no");
  const departmentValue = watch("department");
  const sectionValue = watch("section");

  const sectionOptionsForDepartment = useMemo(() => {
    const dept = departments.find((d) => d.title === departmentValue);
    if (!dept) return [];
    return sections.filter((s) => s.department_id === dept.id);
  }, [departments, departmentValue, sections]);

  useEffect(() => {
    if (configLoading) return;
    if (!departmentValue?.trim()) {
      if (sectionValue?.trim()) setValue("section", "");
      return;
    }
    const valid =
      !sectionValue?.trim() ||
      sectionOptionsForDepartment.some((s) => s.title === sectionValue);
    if (!valid) setValue("section", "");
  }, [
    configLoading,
    departmentValue,
    sectionValue,
    sectionOptionsForDepartment,
    setValue,
  ]);

  const cityComboOptions = useMemo(
    () =>
      PAKISTAN_CITIES.map((c, i) => ({
        id: `pk-city-${i}`,
        title: c,
      })),
    [],
  );

  const [cnicDuplicateBlocked, setCnicDuplicateBlocked] = useState(false);
  const [cnicLookupPending, setCnicLookupPending] = useState(false);
  const cnicDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cnicCheckSeqRef = useRef(0);

  const canSave = useMemo(
    () =>
      addEmployeeSchema.safeParse(values).success &&
      !cnicDuplicateBlocked &&
      !cnicLookupPending,
    [values, cnicDuplicateBlocked, cnicLookupPending],
  );

  function handleCloseForm() {
    router.push("/employees");
  }

  /** Department + section — same form fields rendered on Personal and Work tabs (linked via `watch` / `setValue`). */
  const renderDepartmentSectionFields = (suffix: "personal" | "work") => (
    <>
      {configError ? (
        <div
          className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          Could not load departments/sections: {configError}. Check
          Configuration in Supabase and try again.
        </div>
      ) : null}
      <div>
        <label htmlFor={`department-${suffix}`} className={labelClass}>
          Department
          <ReqStar />
        </label>
        <SearchableCombobox
          id={`department-${suffix}`}
          options={departments}
          value={departmentValue ?? ""}
          onChange={(v) =>
            setValue("department", v, { shouldValidate: true, shouldDirty: true })
          }
          onBlur={() => void trigger("department")}
          loading={configLoading}
          disabled={configLoading || departments.length === 0}
          inputClassName={inputClass}
          emptyMessage="No departments — add in Configuration"
          searchPlaceholder="Search or select department"
          aria-invalid={Boolean(errors.department)}
        />
        {errors.department ? (
          <p className={errorClass} role="alert">
            {errors.department.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor={`section-${suffix}`} className={labelClass}>
          Section
          <ReqStar />
        </label>
        <SearchableCombobox
          id={`section-${suffix}`}
          options={sectionOptionsForDepartment}
          value={sectionValue ?? ""}
          onChange={(v) =>
            setValue("section", v, { shouldValidate: true, shouldDirty: true })
          }
          onBlur={() => void trigger("section")}
          loading={configLoading}
          disabled={
            configLoading ||
            !departmentValue?.trim() ||
            sectionOptionsForDepartment.length === 0
          }
          inputClassName={inputClass}
          emptyMessage={
            !departmentValue?.trim()
              ? "Select a department first"
              : "No sections for this department — add in Configuration"
          }
          searchPlaceholder="Search or select section"
          aria-invalid={Boolean(errors.section)}
        />
        {errors.section ? (
          <p className={errorClass} role="alert">
            {errors.section.message}
          </p>
        ) : null}
      </div>
    </>
  );

  useEffect(() => {
    const el = tabScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [activeTab]);

  /** Live CNIC duplicate check when format is complete (debounced). */
  useEffect(() => {
    if (cnicDebounceRef.current) {
      clearTimeout(cnicDebounceRef.current);
      cnicDebounceRef.current = null;
    }
    const trimmed = (cnicNo ?? "").trim();
    if (!CNIC_FORMAT_REGEX.test(trimmed)) {
      setCnicDuplicateBlocked(false);
      setCnicLookupPending(false);
      void trigger("cnic_no");
      return;
    }
    setCnicLookupPending(true);
    const seq = ++cnicCheckSeqRef.current;
    cnicDebounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const taken = await isEmployeeCnicTaken(
        supabase,
        trimmed,
        editEmployeeId ?? null,
      );
      if (seq !== cnicCheckSeqRef.current) return;
      setCnicLookupPending(false);
      if (taken) {
        setCnicDuplicateBlocked(true);
        setError("cnic_no", { type: "validate", message: DUPLICATE_MSG });
      } else {
        setCnicDuplicateBlocked(false);
        clearErrors("cnic_no");
        void trigger("cnic_no");
      }
    }, 450);
    return () => {
      if (cnicDebounceRef.current) {
        clearTimeout(cnicDebounceRef.current);
        cnicDebounceRef.current = null;
      }
    };
  }, [cnicNo, editEmployeeId, setError, clearErrors, trigger]);

  useEffect(() => {
    const id = editEmployeeId;
    if (!id) {
      setLoadingEmployee(false);
      return;
    }
    if (initialEmployee) {
      setDraftId(id);
      setLoadingEmployee(false);
      return;
    }
    const employeeId: string = id;
    let cancelled = false;
    const supabase = createClient();

    async function loadEmployeeForEdit() {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();
      if (cancelled) return;
      if (error || !data) {
        toast.error("Could not load employee", {
          description: error?.message ?? "Not found",
        });
        router.push("/employees");
        return;
      }
      const d = data as Record<string, unknown>;
      reset(employeeDbRowToFormValues(d));
      setDraftId(employeeId);
      setLoadingEmployee(false);
    }

    void loadEmployeeForEdit();
    return () => {
      cancelled = true;
    };
  }, [editEmployeeId, initialEmployee, reset, router]);

  useEffect(() => {
    if (serverOptionsOk) {
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    async function loadConfigurationOptions() {
      setConfigLoading(true);
      setConfigError(null);
      const [dRes, sRes] = await Promise.all([
        supabase.from("departments").select("id, title").order("title"),
        supabase.from("sections").select("id, title, department_id").order("title"),
      ]);
      if (cancelled) return;
      if (dRes.error || sRes.error) {
        setConfigError(
          dRes.error?.message ?? sRes.error?.message ?? "Could not load options",
        );
        setDepartments([]);
        setSections([]);
      } else {
        setDepartments((dRes.data as ConfigOptionRow[]) ?? []);
        setSections((sRes.data as SectionOptionRow[]) ?? []);
      }
      setConfigLoading(false);
    }

    void loadConfigurationOptions();
    return () => {
      cancelled = true;
    };
  }, [serverOptionsOk]);

  function docFolder(field: DocFieldKey) {
    return `drafts/${draftId}/${DOC_SLUGS[field]}`;
  }

  function onDocUploaded(field: DocFieldKey, url: string) {
    setValue(field, url, { shouldDirty: true, shouldValidate: true });
    clearErrors(field);
  }

  const tabIndex = tabOrder.indexOf(activeTab);
  const isFirstTab = tabIndex <= 0;
  const isLastTab = tabIndex >= tabOrder.length - 1;

  function goPrev() {
    if (!isFirstTab) setActiveTab(tabOrder[tabIndex - 1] as TabId);
  }

  function goNext() {
    if (!isLastTab) setActiveTab(tabOrder[tabIndex + 1] as TabId);
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

    const social_links = normalizeSocialLinksForDb({
      instagram: data.social_instagram,
      facebook: data.social_facebook,
      tiktok: data.social_tiktok,
      youtube: data.social_youtube,
      snapchat: data.social_snapchat,
      twitter: data.social_twitter,
    });

    const cnicDuplicate = await isEmployeeCnicTaken(
      supabase,
      data.cnic_no,
      editEmployeeId ?? null,
    );
    if (cnicDuplicate) {
      setSubmitError(DUPLICATE_MSG);
      setError("cnic_no", { message: DUPLICATE_MSG });
      toast.error("Could not save employee", { description: DUPLICATE_MSG });
      setActiveTab("personal");
      return;
    }

    const payload = {
      full_name: data.full_name,
      father_name: data.father_name || null,
      dob: data.dob || null,
      cnic_no: data.cnic_no,
      ss_eubi_no: data.ss_eubi_no || null,
      basic_salary: data.basic_salary.trim() || null,
      phone_no: data.phone_no || null,
      city: data.city || null,
      address: data.address || null,
      department: data.department,
      section: data.section || null,
      status: data.status,
      education: data.education || null,
      experience: data.experience || null,
      social_media_link: null,
      social_links: social_links,
      email_address: data.email_address || null,
      reference_info: data.reference_info || null,
      family_name: null,
      family_father_name: data.father_name || null,
      family_cnic: data.family_cnic || null,
      family_phone: data.family_phone || null,
      family_phone_alt: data.family_phone_alt || null,
      profile_image: data.profile_image,
      cnic_front: data.cnic_front || null,
      cnic_back: data.cnic_back || null,
      father_image: data.father_image || null,
      father_cnic_front: data.father_cnic_front || null,
      father_cnic_back: data.father_cnic_back || null,
      other_documents,
    };

    const selectCols =
      "id, profile_image, full_name, father_name, dob, cnic_no, ss_eubi_no, basic_salary, phone_no, city, department, section, status, education, address, experience, social_media_link, social_links, email_address, reference_info, family_name, family_father_name, family_cnic, family_phone, family_phone_alt";

    if (editEmployeeId) {
      const { data: updated, error } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", editEmployeeId)
        .select(selectCols)
        .single();

      if (error) {
        if (error.code === "23505") {
          const msg = "This CNIC number is already registered.";
          setSubmitError(msg);
          setError("cnic_no", { message: "Already registered" });
          toast.error("Could not update employee", { description: msg });
          setActiveTab("personal");
        } else {
          setSubmitError(error.message);
          toast.error("Could not update employee", {
            description: error.message,
          });
        }
        return;
      }

      toast.success("Employee updated", {
        description: `${data.full_name} has been saved.`,
        duration: 4500,
      });

      reset(defaultValues);
      clearErrors();
      setSubmitError(null);
      setDraftId(crypto.randomUUID());
      setActiveTab("personal");

      router.push("/employees");
      router.refresh();
      return;
    }

    const { data: inserted, error } = await supabase
      .from("employees")
      .insert(payload)
      .select(selectCols)
      .single();

    if (error) {
      if (error.code === "23505") {
        const msg = "This CNIC number is already registered.";
        setSubmitError(msg);
        setError("cnic_no", { message: "Already registered" });
        toast.error("Could not save employee", { description: msg });
        setActiveTab("personal");
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
    setActiveTab("personal");

    router.push("/employees");
    router.refresh();
  }

  if (loadingEmployee) {
    return (
      <div
        className={`${inter.className} relative flex min-h-0 w-full min-w-0 flex-1 flex-col`}
        aria-busy="true"
        aria-label="Loading employee"
      >
        <AddEmployeeFormSkeleton />
        <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-6 sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            Loading…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${inter.className} flex min-h-0 w-full min-w-0 flex-1 flex-col text-slate-900 antialiased dark:text-slate-100`}
    >
      {submitError ? (
        <p className="mb-6 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {submitError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          <div className="flex shrink-0 items-start gap-2 border-b border-slate-100 bg-slate-50/90 p-2 dark:border-slate-800 dark:bg-slate-950/60">
            <div
              role="tablist"
              aria-label="Employee form sections"
              className="flex min-w-0 flex-1 flex-wrap gap-1"
            >
              {TABS.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition sm:px-4",
                      selected
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => router.push("/employees")}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Close form"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div
            ref={tabScrollRef}
            className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain p-6 sm:p-10"
          >
            <div
              role="tabpanel"
              id="panel-personal"
              aria-labelledby="tab-personal"
              className="w-full min-w-0"
              hidden={activeTab !== "personal"}
            >
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className={labelClass}>
                    Full name
                    <ReqStar />
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
                  <label htmlFor="status" className={labelClass}>
                    Status
                    <ReqStar />
                  </label>
                  <select
                    id="status"
                    className={inputClass}
                    {...register("status")}
                  >
                    <option value={EMPLOYEE_STATUS.Active}>Active</option>
                    <option value={EMPLOYEE_STATUS.UnActive}>Un-Active</option>
                  </select>
                  {errors.status ? (
                    <p className={errorClass} role="alert">
                      {errors.status.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="father_name" className={labelClass}>
                    Father’s name
                    <ReqStar />
                  </label>
                  <input
                    id="father_name"
                    type="text"
                    className={inputClass}
                    {...register("father_name")}
                  />
                  {errors.father_name ? (
                    <p className={errorClass} role="alert">
                      {errors.father_name.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="dob" className={labelClass}>
                    Date of birth
                    <ReqStar />
                  </label>
                  <input
                    id="dob"
                    type="date"
                    className={inputClass}
                    {...register("dob")}
                  />
                  {errors.dob ? (
                    <p className={errorClass} role="alert">
                      {errors.dob.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="cnic_no" className={labelClass}>
                    CNIC / national ID
                    <ReqStar />
                  </label>
                  <Controller
                    name="cnic_no"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="cnic_no"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="33203-1234567-5"
                        maxLength={15}
                        className={inputClass}
                        aria-invalid={Boolean(errors.cnic_no)}
                        aria-busy={cnicLookupPending}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatCnicInput(e.target.value))
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  {cnicLookupPending &&
                  CNIC_FORMAT_REGEX.test((cnicNo ?? "").trim()) ? (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Checking CNIC…
                    </p>
                  ) : null}
                  {errors.cnic_no?.message ? (
                    <p className={errorClass} role="alert">
                      {errors.cnic_no.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="ss_eubi_no" className={labelClass}>
                    SS / EOBI number
                  </label>
                  <input
                    id="ss_eubi_no"
                    type="text"
                    className={inputClass}
                    {...register("ss_eubi_no")}
                  />
                </div>
                {renderDepartmentSectionFields("personal")}
                <div>
                  <label htmlFor="basic_salary" className={labelClass}>
                    Basic salary
                  </label>
                  <input
                    id="basic_salary"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="e.g. 50000"
                    className={inputClass}
                    aria-invalid={Boolean(errors.basic_salary)}
                    {...register("basic_salary")}
                  />
                  {errors.basic_salary ? (
                    <p className={errorClass} role="alert">
                      {errors.basic_salary.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="phone_no" className={labelClass}>
                    Phone number
                    <ReqStar />
                  </label>
                  <Controller
                    name="phone_no"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="phone_no"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="0305-1234567"
                        maxLength={12}
                        className={inputClass}
                        aria-invalid={Boolean(errors.phone_no)}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatPhoneInput(e.target.value))
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  {errors.phone_no ? (
                    <p className={errorClass} role="alert">
                      {errors.phone_no.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>
                    City
                    <ReqStar />
                  </label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <SearchableCombobox
                        id="city"
                        options={cityComboOptions}
                        value={field.value ?? ""}
                        onChange={(v) => field.onChange(v)}
                        onBlur={() => {
                          field.onBlur();
                          void trigger("city");
                        }}
                        inputClassName={inputClass}
                        emptyMessage="No cities in list"
                        searchPlaceholder="Search or select city"
                        allowCustomValue
                        listMaxHeightClass="max-h-[11rem]"
                        aria-invalid={Boolean(errors.city)}
                      />
                    )}
                  />
                  {errors.city ? (
                    <p className={errorClass} role="alert">
                      {errors.city.message}
                    </p>
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>
                    Address
                    <ReqStar />
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    className={`${inputClass} resize-y`}
                    {...register("address")}
                  />
                  {errors.address ? (
                    <p className={errorClass} role="alert">
                      {errors.address.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              role="tabpanel"
              id="panel-work"
              aria-labelledby="tab-work"
              className="w-full min-w-0"
              hidden={activeTab !== "work"}
            >
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {renderDepartmentSectionFields("work")}
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
            </div>

            <div
              role="tabpanel"
              id="panel-social"
              aria-labelledby="tab-social"
              className="w-full min-w-0"
              hidden={activeTab !== "social"}
            >
              <div className="flex w-full min-w-0 flex-col gap-8">
                <div className="w-full min-w-0">
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

                <div className="w-full">
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

                <div>
                  <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Social media{" "}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      (optional — up to 6 links)
                    </span>
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {SOCIAL_PLATFORM_FIELDS.map(({ key, name, label }) => (
                      <div
                        key={name}
                        className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <SocialPlatformIcon platform={key} />
                        <div className="min-w-0 flex-1">
                          <label htmlFor={name} className={labelClass}>
                            {label}
                          </label>
                          <input
                            id={name}
                            type="url"
                            inputMode="url"
                            autoComplete="off"
                            placeholder="https://"
                            className={inputClass}
                            {...register(name)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              role="tabpanel"
              id="panel-family"
              aria-labelledby="tab-family"
              className="w-full min-w-0"
              hidden={activeTab !== "family"}
            >
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="family_father_name" className={labelClass}>
                    Father name
                    <ReqStar />
                  </label>
                  <input
                    id="family_father_name"
                    type="text"
                    autoComplete="name"
                    aria-required="true"
                    title="Linked with Personal → Father’s name"
                    className={inputClass}
                    value={fatherName}
                    onChange={(e) =>
                      setValue("father_name", e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    onBlur={() => void trigger("father_name")}
                  />
                  {errors.father_name ? (
                    <p className={errorClass} role="alert">
                      {errors.father_name.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="family_cnic" className={labelClass}>
                    Father CNIC
                  </label>
                  <Controller
                    name="family_cnic"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="family_cnic"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="33203-1234567-5"
                        maxLength={15}
                        className={inputClass}
                        aria-invalid={Boolean(errors.family_cnic)}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatCnicInput(e.target.value))
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  {errors.family_cnic ? (
                    <p className={errorClass} role="alert">
                      {errors.family_cnic.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="family_phone" className={labelClass}>
                    Father phone (main)
                    <ReqStar />
                  </label>
                  <Controller
                    name="family_phone"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="family_phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        aria-required="true"
                        placeholder="0305-1234567"
                        maxLength={12}
                        className={inputClass}
                        aria-invalid={Boolean(errors.family_phone)}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatPhoneInput(e.target.value))
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  {errors.family_phone ? (
                    <p className={errorClass} role="alert">
                      {errors.family_phone.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="family_phone_alt" className={labelClass}>
                    Father phone (alternate)
                  </label>
                  <Controller
                    name="family_phone_alt"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="family_phone_alt"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="0305-1234567"
                        maxLength={12}
                        className={inputClass}
                        aria-invalid={Boolean(errors.family_phone_alt)}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatPhoneInput(e.target.value))
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  {errors.family_phone_alt ? (
                    <p className={errorClass} role="alert">
                      {errors.family_phone_alt.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              role="tabpanel"
              id="panel-documents"
              aria-labelledby="tab-documents"
              className="w-full min-w-0"
              hidden={activeTab !== "documents"}
            >
              <h2 className="mb-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Document uploads
              </h2>
              <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Images are uploaded to secure storage when selected. Thumbnails
                appear after upload.
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/80 dark:bg-slate-900/50">
                  <EmployeeDocUploadField
                    id="profile_image"
                    label="Profile photo"
                    requiredMark
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
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirstTab}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={isLastTab}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={isSubmitting}
                className="inline-flex min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!canSave || isSubmitting}
                title={
                  cnicDuplicateBlocked
                    ? DUPLICATE_MSG
                    : cnicLookupPending
                      ? "Checking CNIC…"
                      : canSave
                        ? undefined
                        : "Fill all required fields to save"
                }
                className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {editEmployeeId ? "Save changes" : "Save employee"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
