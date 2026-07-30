import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  GITHUB_TOKEN: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  REPOPULSE_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  REPOPULSE_STALE_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  REPOPULSE_RATE_LIMIT_REQUESTS: z.coerce.number().int().positive().default(60),
  REPOPULSE_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
});

export const env = schema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || undefined,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  REPOPULSE_CACHE_TTL_SECONDS: process.env.REPOPULSE_CACHE_TTL_SECONDS,
  REPOPULSE_STALE_TTL_SECONDS: process.env.REPOPULSE_STALE_TTL_SECONDS,
  REPOPULSE_RATE_LIMIT_REQUESTS: process.env.REPOPULSE_RATE_LIMIT_REQUESTS,
  REPOPULSE_RATE_LIMIT_WINDOW_SECONDS: process.env.REPOPULSE_RATE_LIMIT_WINDOW_SECONDS,
});
