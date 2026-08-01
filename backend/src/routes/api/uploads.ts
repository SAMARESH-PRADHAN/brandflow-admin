import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { parseJsonBody } from "../../lib/http.js";
import {
  buildObjectKey,
  deleteFromR2,
  extensionForContentType,
  isR2Configured,
  parseBase64Image,
  uploadToR2,
} from "../../lib/storage.js";

const ALLOWED_FOLDERS = new Set([
  "products",
  "b2b-products",
  "new-collection",
  "welcome-kits",
  "orders",
  "reviews",
  "uploads",
]);

function requireR2() {
  if (!isR2Configured()) {
    throw new HTTPException(503, { message: "R2 storage is not configured" });
  }
}

function normalizeFolder(folder: string | undefined): string {
  const value = (folder ?? "uploads").trim().toLowerCase();
  if (!ALLOWED_FOLDERS.has(value)) {
    throw new HTTPException(400, {
      message: `Invalid folder. Allowed: ${[...ALLOWED_FOLDERS].join(", ")}`,
    });
  }
  return value;
}

import { rateLimit } from "../../middleware/rate-limit.js";
export const uploadRoutes = new Hono();

uploadRoutes.post("/", rateLimit(10, 60000), async (c) => {
  requireR2();

  const contentType = c.req.header("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    const file = body.file ?? body.image;

    if (!file || typeof file === "string") {
      throw new HTTPException(400, { message: "Missing file field (file or image)" });
    }

    const folder = normalizeFolder(
      typeof body.folder === "string" ? body.folder : undefined,
    );
    const id = typeof body.id === "string" ? body.id : undefined;
    const index =
      typeof body.index === "string" ? Number.parseInt(body.index, 10) : undefined;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";
    const ext = extensionForContentType(mimeType);
    const key = buildObjectKey(folder, { id, index, ext });
    const url = await uploadToR2(buffer, key, mimeType);

    return c.json({ url, key }, 201);
  }

  const body = await parseJsonBody<{
    image?: string;
    folder?: string;
    id?: string;
    index?: number;
  }>(c);

  if (!body.image?.trim()) {
    throw new HTTPException(400, { message: "Missing image (base64 data URL or raw base64)" });
  }

  const folder = normalizeFolder(body.folder);
  const { buffer, contentType: mimeType } = parseBase64Image(body.image.trim());
  const ext = extensionForContentType(mimeType);
  const key = buildObjectKey(folder, { id: body.id, index: body.index, ext });
  const url = await uploadToR2(buffer, key, mimeType);

  return c.json({ url, key }, 201);
});

uploadRoutes.delete("/", async (c) => {
  requireR2();

  const body = await parseJsonBody<{ url?: string; key?: string }>(c);
  const target = body.url?.trim() || body.key?.trim();

  if (!target) {
    throw new HTTPException(400, { message: "Missing url or key" });
  }

  try {
    await deleteFromR2(target);
    return c.json({ ok: true });
  } catch (err) {
    console.error("[uploads] R2 delete failed:", err);
    throw new HTTPException(502, { message: "Failed to delete object from R2" });
  }
});
