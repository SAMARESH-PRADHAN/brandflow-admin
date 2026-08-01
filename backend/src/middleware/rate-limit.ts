import type { Context, Next } from "hono";

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(limit: number, windowMs: number = 60000) {
  return async (c: Context, next: Next) => {
    // Basic IP extraction. In production, consider x-forwarded-for if behind proxy
    const ip = c.req.header("x-forwarded-for") || c.env?.REMOTE_ADDR || "unknown";
    
    const now = Date.now();
    let record = store.get(ip);
    
    if (!record || record.resetAt < now) {
      record = { count: 1, resetAt: now + windowMs };
    } else {
      record.count++;
    }
    
    store.set(ip, record);
    
    if (record.count > limit) {
      c.header("Retry-After", String(Math.ceil((record.resetAt - now) / 1000)));
      return c.json({ error: "Too many requests, please try again later." }, 429);
    }
    
    await next();
  };
}
