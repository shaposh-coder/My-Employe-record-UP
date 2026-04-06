"use client";

import { Loader2, UploadCloud } from "lucide-react";

type FileUploadFieldProps = {
  id: string;
  label: string;
  /** Red asterisk after label (required field). */
  requiredMark?: boolean;
  description?: string;
  value: string | undefined;
  error?: string;
  uploading: boolean;
  onFileSelect: (file: File) => void | Promise<void>;
  disabled?: boolean;
};

export function FileUploadField({
  id,
  label,
  requiredMark,
  description,
  value,
  error,
  uploading,
  onFileSelect,
  disabled,
}: FileUploadFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-800 dark:text-slate-200"
      >
        {label}
        {requiredMark ? (
          <span
            className="ml-0.5 text-red-600 dark:text-red-400"
            aria-hidden="true"
          >
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <label
          htmlFor={id}
          className={[
            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800",
            (disabled || uploading) && "pointer-events-none opacity-60",
          ].join(" ")}
        >
          {uploading ? (
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin text-slate-600 dark:text-slate-400"
              aria-hidden
            />
          ) : (
            <UploadCloud className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          )}
          {uploading ? "Uploading…" : "Choose file"}
          <input
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFileSelect(file);
              e.target.value = "";
            }}
          />
        </label>
        {value ? (
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic Supabase public URLs */}
            <img
              src={value}
              alt=""
              className="h-16 w-16 shrink-0 rounded-md object-cover"
            />
            <p
              className="truncate text-xs text-slate-600 dark:text-slate-400"
              title={value}
            >
              {value}
            </p>
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
