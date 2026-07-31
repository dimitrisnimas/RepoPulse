import { env } from "@/config/env";
import type { CacheEntry, CacheResult } from "./cache.types";

const globalCache = globalThis as typeof globalThis & { __repopulseCache?: Map<string, CacheEntry<string>> };
const memory = globalCache.__repopulseCache ??= new Map();

async function redis(command: Array<string | number>): Promise<unknown> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  const response = await fetch(env.UPSTASH_REDIS_REST_URL, {
    method: "POST", headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command), cache: "no-store", signal: AbortSignal.timeout(2_500),
  });
  if (!response.ok) throw new Error("Cache service unavailable");
  return ((await response.json()) as { result: unknown }).result;
}
export async function cacheCommand(command:Array<string|number>){return redis(command)}

export async function getCachedSvg(key: string): Promise<CacheResult<string> | null> {
  const now = Date.now();
  try {
    const raw = await redis(["GET", key]);
    if (typeof raw === "string") {
      const entry = JSON.parse(raw) as CacheEntry<string>;
      if (entry.staleUntil > now) return { value: entry.value, state: entry.freshUntil > now ? "HIT" : "STALE", fresh: entry.freshUntil > now };
    }
  } catch { /* fall back to process memory */ }
  const entry = memory.get(key);
  if (!entry || entry.staleUntil <= now) { memory.delete(key); return null; }
  return { value: entry.value, state: entry.freshUntil > now ? "HIT" : "STALE", fresh: entry.freshUntil > now };
}

export async function setCachedSvg(key: string, value: string, freshSeconds = env.REPOPULSE_CACHE_TTL_SECONDS): Promise<void> {
  const now = Date.now();
  const entry: CacheEntry<string> = { value, freshUntil: now + freshSeconds * 1000, staleUntil: now + env.REPOPULSE_STALE_TTL_SECONDS * 1000 };
  memory.set(key, entry);
  try { await redis(["SET", key, JSON.stringify(entry), "EX", env.REPOPULSE_STALE_TTL_SECONDS]); } catch { /* memory fallback remains available */ }
}
