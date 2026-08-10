import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
  folderPrefix: string;
};

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  const folderPrefix = (process.env.R2_FOLDER_PREFIX ?? "employee-attachments")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicBaseUrl
  ) {
    throw new Error("Cloudflare R2 is not configured on the server.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
    folderPrefix,
  };
}

export function createR2Client(config: R2Config = getR2Config()): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

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
  fileName: string,
): string {
  const folder = normalizeEmployeeDocsFolderPath(folderPath);
  const ext =
    fileName.includes(".") && fileName.split(".").pop()
      ? fileName.split(".").pop()!.toLowerCase()
      : "jpg";
  const stem = fileName.replace(/\.[^.]+$/, "") || "file";
  const safe = stem.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const uniqueName = `${Date.now()}-${safe}.${ext}`;
  return folder ? `${folder}/${uniqueName}` : uniqueName;
}

export function toR2ObjectKey(config: R2Config, objectPath: string): string {
  const path = normalizeEmployeeDocsFolderPath(objectPath);
  return config.folderPrefix ? `${config.folderPrefix}/${path}` : path;
}

export function publicUrlForR2Key(config: R2Config, objectKey: string): string {
  const key = objectKey.replace(/^\/+/, "");
  return `${config.publicBaseUrl}/${key}`;
}

export async function uploadBufferToR2(options: {
  body: Buffer | Uint8Array;
  objectPath: string;
  contentType?: string;
  config?: R2Config;
  client?: S3Client;
}): Promise<string> {
  const config = options.config ?? getR2Config();
  const client = options.client ?? createR2Client(config);
  const objectKey = toR2ObjectKey(
    config,
    normalizeEmployeeDocsFolderPath(options.objectPath),
  );

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: options.body,
      ContentType: options.contentType || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return publicUrlForR2Key(config, objectKey);
}
