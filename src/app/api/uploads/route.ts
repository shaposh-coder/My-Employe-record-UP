import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeEmployeeDocsFolderPath,
  uploadBufferToR2,
} from "@/lib/storage/r2";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Authenticated upload to Cloudflare R2. Returns `{ url }` public object URL.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const objectPathRaw = form.get("objectPath");
  const folderPathRaw = form.get("folderPath");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 15MB)" },
      { status: 400 },
    );
  }

  let objectPath: string;
  if (typeof objectPathRaw === "string" && objectPathRaw.trim()) {
    objectPath = normalizeEmployeeDocsFolderPath(objectPathRaw);
  } else if (typeof folderPathRaw === "string" && folderPathRaw.trim()) {
    const folder = normalizeEmployeeDocsFolderPath(folderPathRaw);
    const ext =
      file.name.includes(".") && file.name.split(".").pop()
        ? file.name.split(".").pop()!.toLowerCase()
        : "jpg";
    const stem = file.name.replace(/\.[^.]+$/, "") || "file";
    const safe = stem.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    objectPath = `${folder}/${Date.now()}-${safe}.${ext}`;
  } else {
    return NextResponse.json(
      { error: "objectPath or folderPath is required" },
      { status: 400 },
    );
  }

  if (!objectPath || objectPath.includes("..")) {
    return NextResponse.json({ error: "Invalid object path" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadBufferToR2({
      body: buffer,
      objectPath,
      contentType: file.type || "application/octet-stream",
    });
    return NextResponse.json({ url, path: objectPath });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
