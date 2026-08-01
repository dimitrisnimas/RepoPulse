# RepoPulse architecture

RepoPulse is a stateless Next.js App Router service. Public route handlers validate and normalize bounded query parameters before creating canonical cache keys. Fresh SVGs are served from Upstash Redis or a bounded process-local fallback. Stale entries remain available during GitHub failures. In-process promise deduplication and short Redis locks prevent request stampedes.

GitHub GraphQL is isolated behind timeout-bound retries and a circuit breaker. Renderers receive typed mapped data and escape every textual value at the XML boundary. Avatar URLs are restricted to HTTPS GitHub hosts. SVG responses have a restrictive CSP, content sniffing protection, immutable validators, and CDN-oriented cache policy.

The Profile Studio is client-only and stores versioned layouts in localStorage. It does not send layout content to the server.

## Scaling boundaries

Instances share cache and locks through Redis; process memory is only a bounded fallback. Internal metrics are per-instance and intentionally lightweight. At sustained multi-region scale, export metrics to a durable OpenTelemetry/Prometheus backend and replace the recent-card Redis list with a queue.

## Intentional trade-offs

- Stale public cards are preferred to broken README images.
- Metrics avoid high-cardinality usernames, IPs, and URLs.
- No database is required because there are no accounts or server-side saved layouts.
- Vercel Hobby cron is daily and imprecise; higher refresh frequency requires an external scheduler or Pro.
