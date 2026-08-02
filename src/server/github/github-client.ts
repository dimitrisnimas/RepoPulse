import { env } from "@/config/env";
import { incrementMetric, observeMetric } from "@/server/observability/metrics";
import { allowCircuitRequest, circuitFailure, circuitSuccess } from "@/server/reliability/circuit-breaker";
import { withRetry } from "@/server/reliability/retry-policy";
import { GitHubError } from "./github-errors";

interface GraphQLErrorPayload { message?: string; type?: string }
export async function githubGraphql<T>(query: string, variables: Record<string, string | null | number>, token = env.GITHUB_TOKEN): Promise<T> {
  if (!token) throw new GitHubError("unavailable", "GitHub integration is not configured", 503);
  if (!allowCircuitRequest()) throw new GitHubError("unavailable", "GitHub circuit is temporarily open", 503);
  const started = performance.now(); incrementMetric("githubRequests");
  try {
    return await withRetry(async () => {
      let response: Response;
      try { response = await fetch("https://api.github.com/graphql", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": `RepoPulse/${env.APP_VERSION}` }, body: JSON.stringify({ query, variables }), cache: "no-store", signal: AbortSignal.timeout(env.REPOPULSE_GITHUB_TIMEOUT_MS) }); }
      catch { throw new GitHubError("unavailable", "GitHub API request timed out", 503); }
      if (response.status === 401 || response.status === 403) { const limited = response.headers.get("x-ratelimit-remaining") === "0"; throw new GitHubError(limited ? "rate_limited" : "unauthorized", limited ? "GitHub rate limit reached" : "GitHub request was rejected", limited ? 429 : 401); }
      if (!response.ok) throw new GitHubError("unavailable", "GitHub API is temporarily unavailable", response.status);
      const payload = await response.json() as { data?: T; errors?: GraphQLErrorPayload[] };
      if (payload.errors?.length) { const notFound = payload.errors.some((error) => error.type === "NOT_FOUND"); throw new GitHubError(notFound ? "not_found" : "unavailable", notFound ? "GitHub resource not found" : "GitHub API request failed", notFound ? 404 : 503); }
      if (!payload.data) throw new GitHubError("unavailable", "GitHub returned an empty response", 503);
      circuitSuccess(); return payload.data;
    }, (error) => error instanceof GitHubError && error.category === "unavailable" && [502, 503, 504].includes(error.status));
  } catch (error) {
    incrementMetric("githubErrors"); if (error instanceof GitHubError && error.category === "unavailable") circuitFailure(); throw error;
  } finally { observeMetric("githubDurationMs", performance.now() - started); }
}
