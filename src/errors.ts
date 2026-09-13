export type ErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "GITHUB_AUTH_FAILED"
  | "GITHUB_PERMISSION_DENIED"
  | "GITHUB_RATE_LIMITED"
  | "GITHUB_UNAVAILABLE"
  | "UPSTREAM_TIMEOUT"
  | "INTERNAL_ERROR";

export class ServiceError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    readonly retryAfter?: number,
  ) {
    super(code);
  }
}

export function retrySeconds(headers: Headers): number {
  const after = headers.get("retry-after");
  const reset = Number(headers.get("x-ratelimit-reset"));
  const seconds = after
    ? /^\d+$/.test(after)
      ? Number(after)
      : (Date.parse(after) - Date.now()) / 1000
    : reset > 0
      ? reset - Date.now() / 1000
      : 60;
  return Number.isFinite(seconds)
    ? Math.max(1, Math.min(86400, Math.ceil(seconds)))
    : 60;
}
