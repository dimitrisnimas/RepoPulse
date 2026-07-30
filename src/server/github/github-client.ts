import { env } from "@/config/env";
import { GitHubError } from "./github-errors";

interface GraphQLErrorPayload { message?: string; type?: string }
export async function githubGraphql<T>(query: string, variables: Record<string, string | null>): Promise<T> {
  if (!env.GITHUB_TOKEN) throw new GitHubError("unavailable", "GitHub integration is not configured", 503);
  let response: Response;
  try {
    response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": "RepoPulse/1.0" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new GitHubError("unavailable", "GitHub API is temporarily unavailable", 503);
  }
  if (response.status === 401 || response.status === 403) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    throw new GitHubError(remaining === "0" ? "rate_limited" : "unauthorized", remaining === "0" ? "GitHub rate limit reached" : "GitHub request was rejected", remaining === "0" ? 429 : 503);
  }
  if (!response.ok) throw new GitHubError("unavailable", "GitHub API is temporarily unavailable", 503);
  const payload = (await response.json()) as { data?: T; errors?: GraphQLErrorPayload[] };
  if (payload.errors?.length) {
    const notFound = payload.errors.some((error) => error.type === "NOT_FOUND");
    throw new GitHubError(notFound ? "not_found" : "unavailable", notFound ? "GitHub user not found" : "GitHub API request failed", notFound ? 404 : 503);
  }
  if (!payload.data) throw new GitHubError("unavailable", "GitHub returned an empty response", 503);
  return payload.data;
}
