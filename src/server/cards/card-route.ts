import { NextResponse } from "next/server";
import type { ZodSafeParseResult } from "zod";
import { getCachedSvg, setCachedSvg } from "@/server/cache/cache-client";
import { renderErrorCard } from "@/server/cards/overview/overview-card";
import { GitHubError } from "@/server/github/github-errors";
import { logError, logInfo } from "@/server/observability/logger";
import { createRequestContext } from "@/server/observability/request-context";
import { checkRateLimit, getRequestIp } from "@/server/rate-limit/rate-limit";
import{env}from"@/config/env";import{acquireDistributedLock,waitForDistributedResult}from"@/server/cache/distributed-lock";import{rememberCardUrl}from"@/server/cache/cache-refresh";

const responseHeaders = { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; img-src https: data:" };
const pending = new Map<string, Promise<string>>();
function response(svg: string, status: number, cache: "HIT" | "MISS" | "STALE", requestId:string,retryAfter?: number) {
  return new NextResponse(svg, { status, headers: { ...responseHeaders, "X-RepoPulse-Cache": cache,"X-RepoPulse-Version":env.APP_VERSION,"X-RepoPulse-Request-Id":requestId, ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) } });
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
    return response(renderErrorCard(message), 400, "MISS",context.requestId);
  }
  const key = cacheKey(parsed.data); const cached = await getCachedSvg(key);
  void rememberCardUrl(request.url);
  if (cached?.fresh) return response(cached.value, 200, "HIT",context.requestId);
  const forceRefresh=request.headers.get("x-repopulse-refresh")==="cron";
  if(cached&&!forceRefresh)return response(cached.value,200,"STALE",context.requestId);
  const rate = await checkRateLimit(getRequestIp(request.headers));
  if (!rate.allowed) return response(renderErrorCard("Too many uncached requests. Please try again shortly.", width(parsed.data), theme(parsed.data)), 429, "MISS",context.requestId, rate.retryAfter);
  try {
    let work = pending.get(key);
    if (!work) {
      const locked=await acquireDistributedLock(key);if(!locked){const waited=await waitForDistributedResult(async()=>{const value=await getCachedSvg(key);return value?.value??null});if(waited)return response(waited,200,"HIT",context.requestId);return response(renderErrorCard("Card generation is already in progress.",width(parsed.data),theme(parsed.data)),503,"MISS",context.requestId)}
      work = generate(parsed.data).then(async (svg) => { await setCachedSvg(key, svg, freshSeconds); return svg; }).finally(() => pending.delete(key));
      pending.set(key, work);
    }
    const svg = await work;
    logInfo("card_request", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", durationMs: Math.round(performance.now() - context.startedAt) });
    return response(svg, 200, "MISS",context.requestId);
  } catch (error) {
    if (cached) return response(cached.value, 200, "STALE",context.requestId);
    const github = error instanceof GitHubError ? error : null;
    const status = github?.status ?? 500;
    const message = github?.category === "not_found" ? "GitHub user not found." : github?.category === "rate_limited" ? "GitHub rate limit reached. Please try again later." : status === 503 ? "GitHub is temporarily unavailable." : "The card could not be rendered.";
    logError("card_request_failed", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", errorCategory: github?.category ?? "render_error" });
    return response(renderErrorCard(message, width(parsed.data), theme(parsed.data)), status, "MISS",context.requestId, status === 429 ? 60 : undefined);
  }
}
