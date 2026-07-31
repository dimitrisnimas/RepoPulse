import { NextResponse } from "next/server";
import type { ZodSafeParseResult } from "zod";
import { getCachedSvg, setCachedSvg } from "@/server/cache/cache-client";
import { renderErrorCard } from "@/server/cards/overview/overview-card";
import { GitHubError } from "@/server/github/github-errors";
import { logError, logInfo } from "@/server/observability/logger";
import { createRequestContext } from "@/server/observability/request-context";
import { checkRateLimit, getRequestIp } from "@/server/rate-limit/rate-limit";

const responseHeaders = { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=172800", "X-Content-Type-Options": "nosniff" };
const pending = new Map<string, Promise<string>>();
function response(svg: string, status: number, cache: "HIT" | "MISS" | "STALE", retryAfter?: number) {
  return new NextResponse(svg, { status, headers: { ...responseHeaders, "X-RepoPulse-Cache": cache, ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) } });
}

export async function handleCardRoute<T>({ request, parse, cacheKey, width, theme, freshSeconds, generate }: {
  request: Request;
  parse: (parameters: URLSearchParams) => ZodSafeParseResult<T>;
  cacheKey: (input: T) => string;
  width: (input: T) => number;
  theme: (input: T) => string;
  freshSeconds: number;
  generate: (input: T) => Promise<string>;
}) {
  const context = createRequestContext(); const url = new URL(request.url); const parsed = parse(url.searchParams);
  if (!parsed.success) {
    const missing = !url.searchParams.get("username");
    const message = missing ? "Add a GitHub username to generate this card." : parsed.error.issues[0]?.message ?? "Invalid card parameters.";
    return response(renderErrorCard(message), 400, "MISS");
  }
  const key = cacheKey(parsed.data); const cached = await getCachedSvg(key);
  if (cached?.fresh) return response(cached.value, 200, "HIT");
  const rate = await checkRateLimit(getRequestIp(request.headers));
  if (!rate.allowed) return response(renderErrorCard("Too many uncached requests. Please try again shortly.", width(parsed.data), theme(parsed.data)), 429, "MISS", rate.retryAfter);
  try {
    let work = pending.get(key);
    if (!work) {
      work = generate(parsed.data).then(async (svg) => { await setCachedSvg(key, svg, freshSeconds); return svg; }).finally(() => pending.delete(key));
      pending.set(key, work);
    }
    const svg = await work;
    logInfo("card_request", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", durationMs: Math.round(performance.now() - context.startedAt) });
    return response(svg, 200, "MISS");
  } catch (error) {
    if (cached) return response(cached.value, 200, "STALE");
    const github = error instanceof GitHubError ? error : null;
    const status = github?.status ?? 500;
    const message = github?.category === "not_found" ? "GitHub user not found." : github?.category === "rate_limited" ? "GitHub rate limit reached. Please try again later." : status === 503 ? "GitHub is temporarily unavailable." : "The card could not be rendered.";
    logError("card_request_failed", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", errorCategory: github?.category ?? "render_error" });
    return response(renderErrorCard(message, width(parsed.data), theme(parsed.data)), status, "MISS", status === 429 ? 60 : undefined);
  }
}
