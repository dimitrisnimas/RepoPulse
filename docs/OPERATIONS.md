# Operations and troubleshooting

## Endpoints

- `/api/health`: process liveness; it must be fast and dependency-free.
- `/api/readiness`: GitHub configuration, cache availability, and circuit state.
- `/api/status`: safe public service summary.
- `/api/internal/metrics`: protected per-instance counters, cache ratios, and latency summaries.

## Common failures

- `401/403` from GitHub: rotate or reconfigure the token. A classic token with no scopes is sufficient for public data.
- `429`: inspect GitHub remaining quota and RepoPulse uncached-request rate limits. Improve cache hit ratio before raising limits.
- Redis unavailable: cards use bounded memory cache, but hit ratio falls across instances. Check Upstash URL/token and latency.
- Persistent stale cards: verify cron authorization, `NEXT_PUBLIC_APP_URL`, recent-card population, and GitHub availability.
- `503` during a burst: a distributed lock may be held or the circuit may be open. Inspect metrics and structured logs by request ID.

## Stress tests

Start a production build locally, then run `STRESS_REQUESTS=100 STRESS_CONCURRENCY=25 pnpm test:stress`. Repeat with 500, 1000, and 5000 requests. Record cold and warm runs, p50/p95/p99, CPU, memory, status distribution, cache headers, GitHub calls, and Redis usage. Never stress a third-party deployment without authorization.
