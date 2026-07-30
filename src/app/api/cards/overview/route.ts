import { NextResponse } from "next/server";
import { overviewCacheKey } from "@/server/cache/cache-keys";
import { getCachedSvg, setCachedSvg } from "@/server/cache/cache-client";
import { renderErrorCard, renderOverviewCard } from "@/server/cards/overview/overview-card";
import { mapOverviewData } from "@/server/cards/overview/overview.mapper";
import { parseOverviewQuery } from "@/server/cards/overview/overview.schema";
import type { OverviewCardOptions } from "@/server/cards/overview/overview.types";
import { GitHubError } from "@/server/github/github-errors";
import { getPublicGitHubProfile } from "@/server/github/github-service";
import { logError, logInfo } from "@/server/observability/logger";
import { createRequestContext } from "@/server/observability/request-context";
import { checkRateLimit, getRequestIp } from "@/server/rate-limit/rate-limit";

export const runtime = "nodejs";
const pending = new Map<string, Promise<string>>();
const headers = { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" };

function svgResponse(svg: string, status: number, cache: "HIT" | "MISS" | "STALE", extra: Record<string, string> = {}) {
  return new NextResponse(svg, { status, headers: { ...headers, "X-RepoPulse-Cache": cache, ...extra } });
}

export async function GET(request: Request) {
  const context = createRequestContext();
  const url = new URL(request.url);
  const parsed = parseOverviewQuery(url.searchParams);
  if (!parsed.success) {
    const missing = !url.searchParams.get("username");
    const message = missing ? "Add a GitHub username to generate this card." : parsed.error.issues[0]?.message ?? "Invalid card parameters.";
    logError("card_request_failed", { requestId: context.requestId, route: url.pathname, errorCategory: missing ? "missing_username" : "invalid_query" });
    return svgResponse(renderErrorCard(message), 400, "MISS");
  }
  const input = parsed.data;
  const options: OverviewCardOptions = { username: input.username, theme: input.theme, width: input.width, showAvatar: input.show_avatar, showIcons: input.show_icons, hideBorder: input.hide_border, hidden: input.hide, locale: input.locale };
  const key = overviewCacheKey(options);
  const cached = await getCachedSvg(key);
  if (cached?.fresh) {
    logInfo("card_request", { requestId: context.requestId, route: url.pathname, cacheState: "HIT", durationMs: Math.round(performance.now() - context.startedAt) });
    return svgResponse(cached.value, 200, "HIT");
  }
  const rate = await checkRateLimit(getRequestIp(request.headers));
  if (!rate.allowed) return svgResponse(renderErrorCard("Too many uncached requests. Please try again shortly.", options.width, options.theme), 429, "MISS", { "Retry-After": String(rate.retryAfter) });
  const githubStarted = performance.now();
  try {
    let work = pending.get(key);
    if (!work) {
      work = (async () => {
        const githubData = await getPublicGitHubProfile(options.username);
        const renderStarted = performance.now();
        const svg = renderOverviewCard(mapOverviewData(githubData), options);
        logInfo("card_generated", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", githubDurationMs: Math.round(renderStarted - githubStarted), renderingDurationMs: Math.round(performance.now() - renderStarted) });
        await setCachedSvg(key, svg);
        return svg;
      })().finally(() => pending.delete(key));
      pending.set(key, work);
    }
    return svgResponse(await work, 200, "MISS");
  } catch (error) {
    if (cached) {
      logError("card_stale_served", { requestId: context.requestId, route: url.pathname, cacheState: "STALE", errorCategory: error instanceof GitHubError ? error.category : "internal" });
      return svgResponse(cached.value, 200, "STALE");
    }
    const githubError = error instanceof GitHubError ? error : null;
    const status = githubError?.status ?? 500;
    const message = githubError?.category === "not_found" ? "GitHub user not found." : githubError?.category === "rate_limited" ? "GitHub rate limit reached. Please try again later." : status === 503 ? "GitHub is temporarily unavailable." : "The card could not be rendered.";
    logError("card_request_failed", { requestId: context.requestId, route: url.pathname, cacheState: "MISS", errorCategory: githubError?.category ?? "internal" });
    return svgResponse(renderErrorCard(message, options.width, options.theme), status, "MISS", status === 429 ? { "Retry-After": "60" } : {});
  }
}
