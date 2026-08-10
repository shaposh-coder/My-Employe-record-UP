/**
 * Client-side helpers for employee document uploads (Cloudflare R2 via API).
 */

import {
  compressImageForUpload,
  withJpegExtension,
} from "@/lib/storage/compress-image";

export const EMPLOYEE_DOCS_BUCKET = "employee-docs";

type UploadOptions = {
  draftId: string;
  /** Stable segment for the file, e.g. "profile", "id-front" */
  slug: string;
  file: File;
};

/** Normalize a folder path: no leading/trailing slashes, single slashes between segments. */
export function normalizeEmployeeDocsFolderPath(folderPath: string): string {
  return folderPath
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
}

/** Build a unique object path under a folder (timestamp + sanitized original name). */
export function buildEmployeeDocsObjectPath(
  folderPath: string,
  file: File,
): string {
  const folder = normalizeEmployeeDocsFolderPath(folderPath);
  const ext =
    file.name.includes(".") && file.name.split(".").pop()
      ? file.name.split(".").pop()!.toLowerCase()
      : "jpg";
  const stem = file.name.replace(/\.[^.]+$/, "") || "file";
  const safe = stem.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const fileName = `${Date.now()}-${safe}.${ext}`;
  return folder ? `${folder}/${fileName}` : fileName;
}

/**
 * Upload a file to a specific path via `/api/uploads` (R2) and return its public URL.
 * Images are compressed (JPEG, max 1600px) before upload.
 */
export async function uploadEmployeeDocByPath(
  file: File,
  objectPath: string,
): Promise<string> {
  const compressed = await compressImageForUpload(file);
  const path =
    compressed.type === "image/jpeg"
      ? withJpegExtension(normalizeEmployeeDocsFolderPath(objectPath))
      : normalizeEmployeeDocsFolderPath(objectPath);

  const form = new FormData();
  form.set("file", compressed);
  form.set("objectPath", path);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: form,
  });

  const payload = (await res.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;

  if (!res.ok) {
    throw new Error(payload?.error || `Upload failed (${res.status})`);
  }
  if (!payload?.url) {
    throw new Error("Upload failed: missing URL in response");
  }
  return payload.url;
}

/**
 * Upload under `folderPath` using a generated unique file name.
 */
export async function uploadEmployeeDocToFolder(
  file: File,
  folderPath: string,
): Promise<string> {
  const objectPath = buildEmployeeDocsObjectPath(folderPath, file);
  return uploadEmployeeDocByPath(file, objectPath);
}

/**
 * Uploads under `drafts/{draftId}/` and returns the public URL for the database.
 */
export async function uploadEmployeeDocument({
  draftId,
  slug,
  file,
}: UploadOptions): Promise<string> {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "file";
  const path = `drafts/${draftId}/${safeSlug}.jpg`;
  return uploadEmployeeDocByPath(file, path);
}
