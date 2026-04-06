import type { SupabaseClient } from "@supabase/supabase-js";

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
export function buildEmployeeDocsObjectPath(folderPath: string, file: File): string {
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
 * Upload a file to a specific path in `employee-docs` and return its public URL.
 */
export async function uploadEmployeeDocByPath(
  client: SupabaseClient,
  file: File,
  objectPath: string,
): Promise<string> {
  const { error } = await client.storage
    .from(EMPLOYEE_DOCS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  const { data } = client.storage
    .from(EMPLOYEE_DOCS_BUCKET)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

/**
 * Upload to `employee-docs` under `folderPath` using a generated unique file name.
 */
export async function uploadEmployeeDocToFolder(
  client: SupabaseClient,
  file: File,
  folderPath: string,
): Promise<string> {
  const objectPath = buildEmployeeDocsObjectPath(folderPath, file);
  return uploadEmployeeDocByPath(client, file, objectPath);
}

/**
 * Uploads a file to the public `employee-docs` bucket under `drafts/{draftId}/`.
 * Returns the public URL for storing in the database.
 */
export async function uploadEmployeeDocument(
  client: SupabaseClient,
  { draftId, slug, file }: UploadOptions,
): Promise<string> {
  const ext =
    file.name.includes(".") && file.name.split(".").pop()
      ? file.name.split(".").pop()!
      : "jpg";
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "file";
  const path = `drafts/${draftId}/${safeSlug}.${ext}`;
  return uploadEmployeeDocByPath(client, file, path);
}
