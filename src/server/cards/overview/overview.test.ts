import { describe, expect, it } from "vitest";
import { overviewCacheKey } from "@/server/cache/cache-keys";
import { escapeXml, formatNumber, safeColor } from "@/server/cards/card-utils";
import { renderErrorCard, renderOverviewCard } from "./overview-card";
import { calculateLanguages, mapOverviewData } from "./overview.mapper";
import { githubUsernameSchema, parseOverviewQuery } from "./overview.schema";
import { resolveTheme } from "@/config/themes";
import { checkRateLimit } from "@/server/rate-limit/rate-limit";
import type { GitHubProfileAggregate } from "@/server/github/github.types";

const aggregate: GitHubProfileAggregate = {
  profile: {
    login: "dimitrisnimas", name: "Dimitris Nimas", avatarUrl: "https://avatars.githubusercontent.com/u/1", bio: null,
    followers: { totalCount: 12 }, following: { totalCount: 3 }, gists: { totalCount: 1 },
    repositories: { totalCount: 2, nodes: [], pageInfo: { hasNextPage: false, endCursor: null } },
    contributionsCollection: { totalCommitContributions: 50, totalIssueContributions: 4, totalPullRequestContributions: 9, totalPullRequestReviewContributions: 6, contributionCalendar: { totalContributions: 80 } },
  },
  repositories: [
    { stargazerCount: 5, forkCount: 2, isArchived: false, languages: { edges: [{ size: 800, node: { name: "TypeScript", color: "#3178c6" } }, { size: 200, node: { name: "CSS", color: "#563d7c" } }] } },
    { stargazerCount: 7, forkCount: 1, isArchived: false, languages: { edges: [{ size: 200, node: { name: "TypeScript", color: "#3178c6" } }] } },
  ],
};
const options = { username: "dimitrisnimas", theme: "midnight", width: 480, showAvatar: true, showIcons: true, hideBorder: false, hidden: [], locale: "en" } as const;

describe("overview validation", () => {
  it("accepts valid GitHub usernames and rejects invalid ones", () => {
    expect(githubUsernameSchema.safeParse("dimitris-nimas").success).toBe(true);
    expect(githubUsernameSchema.safeParse("-invalid").success).toBe(false);
    expect(githubUsernameSchema.safeParse("invalid--name").success).toBe(false);
  });
  it("validates and normalizes query parameters", () => {
    const result = parseOverviewQuery(new URLSearchParams("username=dimitrisnimas&width=520&show_avatar=1&hide=stars,forks"));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ width: 520, show_avatar: true, hide: ["stars", "forks"] });
  });
  it("rejects unsafe dimensions and hidden fields", () => {
    expect(parseOverviewQuery(new URLSearchParams("username=test&width=9999")).success).toBe(false);
    expect(parseOverviewQuery(new URLSearchParams("username=test&hide=style")).success).toBe(false);
  });
});

describe("card utilities and themes", () => {
  it("escapes XML and formats numbers", () => {
    expect(escapeXml(`<script a="x">&'</script>`)).toBe("&lt;script a=&quot;x&quot;&gt;&amp;&apos;&lt;/script&gt;");
    expect(formatNumber(12500, "en")).toMatch(/12[.,]5K/i);
  });
  it("allows only six-digit hex colors in SVG attributes", () => { expect(safeColor("#ABCDEF")).toBe("#abcdef"); expect(safeColor(`red\" onload=\"alert(1)`)).toBe("#8b5cf6"); });
  it("falls back to the dark theme", () => expect(resolveTheme("unsafe").name).toBe("dark"));
});

describe("overview mapping and rendering", () => {
  it("calculates language percentages across repositories", () => {
    expect(calculateLanguages(aggregate.repositories)).toEqual([
      { name: "TypeScript", percentage: 83.3, color: "#3178c6" },
      { name: "CSS", percentage: 16.7, color: "#563d7c" },
    ]);
  });
  it("normalizes aggregate GitHub data", () => {
    const data = mapOverviewData(aggregate, "2026-01-01T00:00:00.000Z");
    expect(data).toMatchObject({ username: "dimitrisnimas", totalStars: 12, totalForks: 3, totalContributions: 80 });
  });
  it("creates deterministic normalized cache keys", () => {
    const first = overviewCacheKey({ ...options, hidden: ["stars", "forks"] });
    const second = overviewCacheKey({ ...options, hidden: ["forks", "stars"] });
    expect(first).toBe(second);
  });
  it("renders a valid standalone accessible SVG", () => {
    const svg = renderOverviewCard(mapOverviewData(aggregate), { ...options, hidden: [] });
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("<title");
    expect(svg).toContain("Dimitris Nimas");
    expect(svg).not.toContain("PUBLIC PROFILE");
    expect(svg).not.toContain("<script");
  });
  it("renders safe SVG error cards", () => {
    const svg = renderErrorCard("<User> not found");
    expect(svg).toContain("&lt;User&gt; not found");
    expect(svg).not.toContain("<User>");
  });
});

describe("rate limiting", () => {
  it("limits a source after the configured request count", async () => {
    const id = `test-${Date.now()}`;
    let result = await checkRateLimit(id);
    for (let index = 1; index <= 60; index += 1) result = await checkRateLimit(id);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
