"use client";

import { useUploadEmployeeDoc } from "@/hooks/use-upload-employee-doc";
import { FileUploadField } from "./file-upload-field";

type EmployeeDocUploadFieldProps = {
  id: string;
  label: string;
  description?: string;
  /** Folder path inside `employee-docs` (e.g. `drafts/<uuid>/profile`). */
  folderPath: string;
  value: string | undefined;
  validationError?: string;
  onUploaded: (url: string) => void;
  disabled?: boolean;
};

/**
 * Single image upload wired to {@link useUploadEmployeeDoc} — each instance has its own `loading` for spinners.
 */
export function EmployeeDocUploadField({
  id,
  label,
  description,
  folderPath,
  value,
  validationError,
  onUploaded,
  disabled,
}: EmployeeDocUploadFieldProps) {
  const { upload, loading, error, clearError } = useUploadEmployeeDoc();

  const message = validationError ?? error ?? undefined;

  return (
    <FileUploadField
      id={id}
      label={label}
      description={description}
      value={value}
      error={message}
      uploading={loading}
      disabled={disabled}
      onFileSelect={async (file) => {
        clearError();
        const url = await upload(file, folderPath);
        if (url) onUploaded(url);
      }}
    />
  );
}
