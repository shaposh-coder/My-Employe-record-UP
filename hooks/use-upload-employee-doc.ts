"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadEmployeeDocToFolder } from "@/lib/storage/upload-employee-doc";

export type UseUploadEmployeeDocResult = {
  /** Upload `file` under `folderPath` in `employee-docs`. Returns public URL or `null` on failure. */
  upload: (file: File, folderPath: string) => Promise<string | null>;
  /** True while any upload started from this hook is in flight (supports concurrent uploads). */
  loading: boolean;
  /** Last error message, or `null` if the last attempt succeeded or was cleared. */
  error: string | null;
  clearError: () => void;
};

/**
 * Client hook for uploading images to the `employee-docs` Supabase Storage bucket.
 *
 * - `folderPath` is a logical folder (e.g. `drafts/abc-uuid` or `drafts/abc-uuid/profile`).
 *   It is normalized; a unique file name is generated so uploads rarely collide.
 * - Use `loading` to show a spinner on the placeholder until the promise resolves.
 * - For multiple independent upload areas, use one hook instance per area so each has its own `loading`.
 */
export function useUploadEmployeeDoc(): UseUploadEmployeeDocResult {
  const inflightRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, folderPath: string): Promise<string | null> => {
      inflightRef.current += 1;
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const url = await uploadEmployeeDocToFolder(supabase, file, folderPath);
        return url;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Upload failed. Please try again.";
        setError(message);
        return null;
      } finally {
        inflightRef.current -= 1;
        if (inflightRef.current <= 0) {
          inflightRef.current = 0;
          setLoading(false);
        }
      }
    },
    [],
  );

  return { upload, loading, error, clearError };
}
