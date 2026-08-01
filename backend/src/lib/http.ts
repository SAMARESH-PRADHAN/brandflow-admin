import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { execute, queryOne } from "../db/pool.js";
import {
  deleteR2UrlsSafely,
  diffRemovedImages,
  extractImageUrlsFromRow,
  isR2StoredUrl,
  parseImagesColumn,
} from "./storage.js";

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

export async function parseJsonBody<T extends Record<string, unknown>>(c: Context): Promise<T> {
  try {
    return (await c.req.json()) as T;
  } catch {
    throw new HTTPException(400, { message: "Invalid JSON body" });
  }
}

export async function requireDb(_c: Context, next: Next) {
  const { getPool } = await import("../db/pool.js");
  if (!getPool()) {
    throw new HTTPException(503, { message: "Database not configured" });
  }
  await next();
}

export function notFoundEntity(name: string): never {
  throw new HTTPException(404, { message: `${name} not found` });
}

export async function deleteById(table: string, id: string) {
  const count = await execute(`DELETE FROM ${table} WHERE id = $1`, [id]);
  if (count === 0) notFoundEntity(table);
}

type ImageCleanupOptions = {
  imageDbColumn?: string;
  imagesDbColumn?: string;
  includeImagesArray?: boolean;
};

/** Fetch row, delete associated R2 objects, then delete the DB row. */
export async function deleteByIdWithImageCleanup(
  table: string,
  id: string,
  options?: ImageCleanupOptions,
) {
  const row = await queryOne(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  if (!row) notFoundEntity(table);

  const urls = extractImageUrlsFromRow(row as Record<string, unknown>, options);
  const count = await execute(`DELETE FROM ${table} WHERE id = $1`, [id]);
  if (count === 0) notFoundEntity(table);

  deleteR2UrlsSafely(urls).catch(err => console.error(`Background R2 cleanup failed for ${table} ${id}:`, err));
}

type ImagePatchCleanupOptions = {
  imageBodyKey?: string;
  imageDbColumn?: string;
  imagesBodyKey?: string;
  imagesDbColumn?: string;
};

/** Diff incoming PATCH body against existing row and delete removed R2 URLs. */
export async function cleanupRemovedImagesOnPatch(
  existingRow: Record<string, unknown>,
  body: Record<string, unknown>,
  options: ImagePatchCleanupOptions = {},
) {
  const imageBodyKey = options.imageBodyKey ?? "image";
  const imageDbColumn = options.imageDbColumn ?? "image";
  const imagesBodyKey = options.imagesBodyKey ?? "images";
  const imagesDbColumn = options.imagesDbColumn ?? "images";

  const toDelete: string[] = [];

  if (body[imagesBodyKey] !== undefined) {
    const existing = parseImagesColumn(existingRow[imagesDbColumn]);
    const incoming = Array.isArray(body[imagesBodyKey])
      ? (body[imagesBodyKey] as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    toDelete.push(...diffRemovedImages(existing, incoming));
  }

  if (body[imageBodyKey] !== undefined) {
    const oldImage = existingRow[imageDbColumn];
    const newImage = body[imageBodyKey];
    if (
      typeof oldImage === "string" &&
      oldImage.trim() &&
      oldImage !== newImage &&
      isR2StoredUrl(oldImage)
    ) {
      toDelete.push(oldImage);
    }
  }

  deleteR2UrlsSafely(toDelete).catch(err => console.error("Background R2 cleanup failed on patch:", err));
}

type FieldMap = Record<string, string>;

export async function patchById(
  table: string,
  id: string,
  body: Record<string, unknown>,
  fieldMap: FieldMap,
) {
  const sets: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  for (const [key, column] of Object.entries(fieldMap)) {
    if (body[key] === undefined) continue;
    sets.push(`${column} = $${index++}`);
    values.push(body[key]);
  }

  if (sets.length === 0) {
    const existing = await queryOne(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (!existing) notFoundEntity(table);
    return existing;
  }

  values.push(id);
  const updatedRow = await queryOne(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${index} RETURNING *`, values);
  if (!updatedRow) notFoundEntity(table);
  return updatedRow;
}
