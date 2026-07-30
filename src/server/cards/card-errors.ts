export type CardErrorCode = "missing_username" | "invalid_username" | "not_found" | "rate_limited" | "github_unavailable" | "service_unavailable" | "render_error";
export class CardError extends Error {
  constructor(public readonly code: CardErrorCode, message: string, public readonly status: number) { super(message); }
}
