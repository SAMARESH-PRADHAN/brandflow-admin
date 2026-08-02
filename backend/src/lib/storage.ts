import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!isR2Configured()) {
      throw new Error("R2 storage is not configured");
    }
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME &&
      env.R2_PUBLIC_URL,
  );
}

export function publicUrlBase(): string {
  return env.R2_PUBLIC_URL!.replace(/\/$/, "");
}

/** Derive the R2 object key from a stored public CDN URL. Returns null if not an R2 URL. */
export function keyFromPublicUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (!trimmed.includes("://")) {
    return trimmed.replace(/^\/+/, "");
  }

  const base = publicUrlBase();
  const prefix = `${base}/`;
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length);
  }

  try {
    const parsed = new URL(trimmed);
    const baseParsed = new URL(base);
    if (parsed.hostname === baseParsed.hostname) {
      return parsed.pathname.replace(/^\/+/, "");
    }
  } catch {
    return null;
  }

  return null;
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${publicUrlBase()}/${key}`;
}

export async function deleteFromR2(keyOrUrl: string): Promise<void> {
  const key =
    keyOrUrl.includes("://") ? keyFromPublicUrl(keyOrUrl) : keyOrUrl.replace(/^\/+/, "");

  if (!key) {
    throw new Error("Could not derive R2 object key from URL");
  }

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}

export function extensionForContentType(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[contentType.toLowerCase()] ?? "jpg";
}

export function buildObjectKey(
  folder: string,
  options?: { id?: string; index?: number; ext?: string },
): string {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "-").replace(/^-+|-+$/g, "") || "uploads";
  const idPart = options?.id?.replace(/[^a-z0-9-]/gi, "-") || String(Date.now());
  const indexPart = options?.index !== undefined ? `-${options.index}` : "";
  const ext = options?.ext ?? "jpg";
  return `${safeFolder}/${idPart}${indexPart}.${ext}`;
}

export function parseBase64Image(data: string): { buffer: Buffer; contentType: string } {
  const match = data.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      contentType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  }
  return {
    contentType: "image/jpeg",
    buffer: Buffer.from(data, "base64"),
  };
}

/** True when the value looks like an R2 CDN URL (not empty, not legacy base64). */
export function isR2StoredUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:")) return false;
  if (!isR2Configured()) return /^https?:\/\//i.test(trimmed);
  return keyFromPublicUrl(trimmed) !== null;
}

export function parseImagesColumn(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function diffRemovedImages(existing: string[], incoming: string[]): string[] {
  const incomingSet = new Set(incoming);
  return existing.filter((url) => url.trim() && !incomingSet.has(url));
}

export function extractImageUrlsFromRow(
  row: Record<string, unknown>,
  options?: { imageDbColumn?: string; imagesDbColumn?: string; includeImagesArray?: boolean },
): string[] {
  const imageCol = options?.imageDbColumn ?? "image";
  const imagesCol = options?.imagesDbColumn ?? "images";
  const includeImages = options?.includeImagesArray !== false;
  const urls: string[] = [];

  const single = row[imageCol];
  if (typeof single === "string" && single.trim()) urls.push(single);

  if (includeImages) {
    urls.push(...parseImagesColumn(row[imagesCol]));
  }

  return [...new Set(urls)];
}

export async function deleteR2UrlSafely(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed) return;

  if (!isR2Configured()) {
    console.warn(
      `[storage] Skipped R2 delete for "${trimmed}" — R2 is not configured. ` +
        `Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL in process.env.`,
    );
    return;
  }

  if (!isR2StoredUrl(trimmed)) {
    console.warn(
      `[storage] Skipped R2 delete for "${trimmed}" — does not resolve to an object key under R2_PUBLIC_URL (${env.R2_PUBLIC_URL}).`,
    );
    return;
  }

  try {
    await deleteFromR2(trimmed);
    console.log(`[storage] Deleted R2 object for "${trimmed}"`);
  } catch (err) {
    console.error("[storage] R2 delete failed:", trimmed, err);
  }
}

export async function deleteR2UrlsSafely(urls: string[]): Promise<void> {
  const unique = [...new Set(urls)].filter((u) => u.trim());
  if (unique.length === 0) return;
  console.log(`[storage] Cleaning up ${unique.length} R2 object(s):`, unique);
  await Promise.all(unique.map((url) => deleteR2UrlSafely(url)));
}