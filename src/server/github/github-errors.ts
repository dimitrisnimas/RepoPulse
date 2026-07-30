export class GitHubError extends Error {
  constructor(public readonly category: "not_found" | "rate_limited" | "unauthorized" | "unavailable", message: string, public readonly status: number) { super(message); }
}
