import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export const env = schema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || undefined,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || undefined,
  REDIS_URL: process.env.REDIS_URL || undefined,
});
