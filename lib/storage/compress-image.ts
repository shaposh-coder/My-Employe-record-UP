/** Max edge length after resize (keeps CNIC / portraits readable). */
const MAX_DIMENSION = 1600;
/** Skip work when the file is already small enough. */
const SKIP_BELOW_BYTES = 350 * 1024;
const JPEG_QUALITY = 0.78;

function isCompressibleImage(file: File): boolean {
  if (!file.type.startsWith("image/")) return false;
  // Animated / special formats — leave as-is
  if (file.type === "image/gif" || file.type === "image/svg+xml") return false;
  return true;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image for compression"));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Image compression failed"));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Resize + JPEG-compress an image in the browser before upload.
 * Non-images and tiny files are returned unchanged.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!isCompressibleImage(file)) return file;
  if (file.size > 0 && file.size <= SKIP_BELOW_BYTES && file.type === "image/jpeg") {
    return file;
  }

  try {
    const img = await loadImage(file);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return file;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(img, 0, 0, tw, th);

    let quality = JPEG_QUALITY;
    let blob = await canvasToJpegBlob(canvas, quality);

    // Second pass if still large (> 1.2MB)
    if (blob.size > 1.2 * 1024 * 1024) {
      quality = 0.65;
      blob = await canvasToJpegBlob(canvas, quality);
    }

    // Keep original if compression somehow grew the file
    if (blob.size >= file.size && file.type === "image/jpeg") {
      return file;
    }

    const stem = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${stem}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/** Ensure object path extension matches a JPEG after compression. */
export function withJpegExtension(objectPath: string): string {
  const normalized = objectPath.replace(/\/+/g, "/");
  const i = normalized.lastIndexOf("/");
  const dir = i >= 0 ? normalized.slice(0, i + 1) : "";
  const name = i >= 0 ? normalized.slice(i + 1) : normalized;
  const stem = name.includes(".") ? name.replace(/\.[^.]+$/, "") : name;
  return `${dir}${stem || "file"}.jpg`;
}
