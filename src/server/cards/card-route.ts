import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import type { ZodSafeParseResult } from "zod";
import { getCachedSvg, setCachedSvg } from "@/server/cache/cache-client";
import { renderErrorCard } from "@/server/cards/overview/overview-card";
import { GitHubError } from "@/server/github/github-errors";
import { logError, logInfo } from "@/server/observability/logger";
import { createRequestContext } from "@/server/observability/request-context";
import { checkRateLimit, getRequestIp } from "@/server/rate-limit/rate-limit";
import{env}from"@/config/env";import{acquireDistributedLock,waitForDistributedResult}from"@/server/cache/distributed-lock";import{rememberCardUrl}from"@/server/cache/cache-refresh";
import { incrementMetric, observeMetric } from "@/server/observability/metrics";
import { validatePublicQuery } from "@/server/security/request-security";

const responseHeaders = { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()", "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; img-src https://avatars.githubusercontent.com https://*.githubusercontent.com data:; sandbox" };
const pending = new Map<string, Promise<string>>();
function response(request: Request, svg: string, status: number, cache: "HIT" | "MISS" | "STALE", requestId:string,retryAfter?: number) {
  const etag = `"${createHash("sha256").update(svg).digest("base64url")}"`;
  const headers = { ...responseHeaders, ETag: etag, "X-RepoPulse-Cache": cache,"X-RepoPulse-Version":env.APP_VERSION,"X-RepoPulse-Request-Id":requestId, ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) };
  if (status === 200 && request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers });
  return new NextResponse(svg, { status, headers });
}

export async function handleCardRoute<T>({ request, parse, cacheKey, width, theme, freshSeconds, generate, identityParameter = "username" }: {
  request: Request;
  parse: (parameters: URLSearchParams) => ZodSafeParseResult<T>;
  cacheKey: (input: T) => string;
  width: (input: T) => number;
  theme: (input: T) => string;
  freshSeconds: number;
  generate: (input: T) => Promise<string>;
  identityParameter?: string | null;
}) {
  const context = createRequestContext(); const url = new URL(request.url); incrementMetric("requests");
  const queryError = validatePublicQuery(url);
  if (queryError) { incrementMetric("errors"); return response(request, renderErrorCard(queryError), 400, "MISS", context.requestId); }
  const parsed = parse(url.searchParams);
  if (!parsed.success) {
    const missing = identityParameter ? !url.searchParams.get(identityParameter) : false;
    const message = missing ? "Add a GitHub username to generate this card." : parsed.error.issues[0]?.message ?? "Invalid card parameters.";
    incrementMetric("errors"); return response(request, renderErrorCard(message), 400, "MISS",context.requestId);
  }
  let key: string;
  try { key = cacheKey(parsed.data); }
  catch (error) { incrementMetric("errors"); logError("card_configuration_failed", { requestId: context.requestId, route: url.pathname, errorCategory: error instanceof Error ? error.name : "configuration_error" }); return response(request, renderErrorCard("This card is not configured correctly.", width(parsed.data), theme(parsed.data)), 503, "MISS", context.requestId); }
  const cached = await getCachedSvg(key);
  void rememberCardUrl(request.url);
  if (cached?.fresh) { incrementMetric("cacheHit"); return response(request, cached.value, 200, "HIT",context.requestId); }
  const forceRefresh=request.headers.get("x-repopulse-refresh")==="cron";
  if(cached&&!forceRefresh){ incrementMetric("cacheStale"); return response(request, cached.value,200,"STALE",context.requestId); }
  const rate = await checkRateLimit(getRequestIp(request.headers));
  if (!rate.allowed) { incrementMetric("rateLimited"); return response(request, renderErrorCard("Too many uncached requests. Please try again shortly.", width(parsed.data), theme(parsed.data)), 429, "MISS",context.requestId, rate.retryAfter); }
  try {
    let work = pending.get(key);
    if (!work) {
      const locked=await acquireDistributedLock(key);if(!locked){const waited=await waitForDistributedResult(async()=>{const value=await getCachedSvg(key);return value?.value??null});if(waited){incrementMetric("cacheHit");return response(request,waited,200,"HIT",context.requestId)}incrementMetric("errors");return response(request,renderErrorCard("Card generation is already in progress.",width(parsed.data),theme(parsed.data)),503,"MISS",context.requestId)}
      const renderStarted=performance.now(); work = generate(parsed.data).then(async (svg) => { if (svg.length > 1_000_000) throw new Error("Rendered SVG exceeds the safety limit"); observeMetric("renderDurationMs",performance.now()-renderStarted);incrementMetric("svgRendered");await setCachedSvg(key, svg, freshSeconds); return svg; }).finally(() => pending.delete(key));
      pending.set(key, work);
    }
    const svg = await work;
    logInfo("card_request", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", durationMs: Math.round(performance.now() - context.startedAt) });
    incrementMetric("cacheMiss"); return response(request, svg, 200, "MISS",context.requestId);
  } catch (error) {
    if (cached) { incrementMetric("cacheStale"); return response(request, cached.value, 200, "STALE",context.requestId); }
    const github = error instanceof GitHubError ? error : null;
    const status = github?.status && github.status >= 400 && github.status < 500 ? github.status : 503;
    const message = github?.category === "not_found" ? "GitHub user not found." : github?.category === "rate_limited" ? "GitHub rate limit reached. Please try again later." : status === 503 ? "GitHub is temporarily unavailable." : "The card could not be rendered.";
    logError("card_request_failed", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", errorCategory: github?.category ?? "render_error", errorName: error instanceof Error ? error.name : "UnknownError", errorMessage: error instanceof Error ? error.message.slice(0,160) : "Unknown failure" });
    incrementMetric("errors"); return response(request, renderErrorCard(message, width(parsed.data), theme(parsed.data)), status, "MISS",context.requestId, status === 429 ? 60 : undefined);
  }
}
