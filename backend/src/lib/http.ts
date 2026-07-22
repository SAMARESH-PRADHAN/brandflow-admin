import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { execute, queryOne } from "../db/pool.js";

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
  const count = await execute(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${index}`, values);
  if (count === 0) notFoundEntity(table);
  return queryOne(`SELECT * FROM ${table} WHERE id = $1`, [id]);
}
