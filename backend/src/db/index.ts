import { neon } from "@neondatabase/serverless";
import { env } from "../config/env.js";

export const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;

export async function checkDbConnection(): Promise<{ ok: boolean; message?: string }> {
  if (!sql) {
    return { ok: false, message: "DATABASE_URL is not configured" };
  }

  try {
    await sql`SELECT 1 AS ok`;
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    return { ok: false, message };
  }
}
