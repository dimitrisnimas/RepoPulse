import { createHash } from "node:crypto";
import { env } from "@/config/env";
import type { RateLimitResult } from "./rate-limit.types";

const globalRate = globalThis as typeof globalThis & { __repopulseRate?: Map<string, { count: number; reset: number }> };
const memory = globalRate.__repopulseRate ??= new Map();
const MEMORY_RATE_LIMIT_MAX_ENTRIES = 10_000;

export function getRequestIp(headers: Headers): string {
  const vercelIp = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  const forwardedIp = process.env.VERCEL ? headers.get("x-forwarded-for")?.split(",")[0]?.trim() : null;
  const ip = vercelIp || forwardedIp || "local";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export async function checkRateLimit(identifier: string, now = Date.now()): Promise<RateLimitResult> {
  const windowSeconds = env.REPOPULSE_RATE_LIMIT_WINDOW_SECONDS;
  const limit = env.REPOPULSE_RATE_LIMIT_REQUESTS;
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const bucket = Math.floor(now / (windowSeconds * 1000));
    const key = `repopulse:rate:${identifier}:${bucket}`;
    try {
      const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
        method: "POST", headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, windowSeconds, "NX"]]), cache: "no-store", signal: AbortSignal.timeout(2_500),
      });
      if (response.ok) {
        const result = (await response.json()) as Array<{ result: number }>;
        const count = result[0]?.result ?? 1;
        return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfter: windowSeconds };
      }
    } catch { /* use memory fallback */ }
  }
  const current = memory.get(identifier);
  if (!current || current.reset <= now) {
    if (memory.size >= MEMORY_RATE_LIMIT_MAX_ENTRIES) for (const [key, value] of memory) { if (value.reset <= now || memory.size >= MEMORY_RATE_LIMIT_MAX_ENTRIES) memory.delete(key); else break; }
    memory.set(identifier, { count: 1, reset: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfter: windowSeconds };
  }
  current.count += 1;
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), retryAfter: Math.max(1, Math.ceil((current.reset - now) / 1000)) };
}
