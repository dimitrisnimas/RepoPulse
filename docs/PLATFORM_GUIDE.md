# Platform guide

## Environment variables

Copy `.env.example` to `.env`. `GITHUB_TOKEN` enables public GitHub API reads. The two Upstash values enable shared cache, locks, recent-card refresh, and distributed rate limiting. `CRON_SECRET` protects refresh and metrics. All `REPOPULSE_*` values are bounded and validated at startup. Variables without the `NEXT_PUBLIC_` prefix must never enter client components.

## Caching

Cache keys include card/version and sorted normalized options. Fresh TTL serves normal traffic; stale TTL provides resilience. Redis is authoritative across instances, while an insertion-bounded memory Map provides process-local fallback. Promise deduplication handles same-instance concurrency and a short Redis lock handles cross-instance stampedes. Version cache keys when renderer semantics change rather than deleting broad keyspaces.

## Rendering

Renderers are deterministic pure functions over typed card data. User and GitHub text must pass through `escapeXml`; URL attributes must use a host allowlist; colors must pass `safeColor`. SVGs must not contain scripts, handlers, `foreignObject`, external stylesheets, remote fonts, or unbounded content. The shared handler rejects output larger than 1 MB.

## GitHub API

GraphQL queries request public fields only and paginate owned public repositories with bounded page sizes. Requests use `AbortSignal.timeout`, retry only transient failures, and feed a circuit breaker. Rate-limit responses are categorized separately. Avoid query aliases or fields that scale with user-controlled cardinality. Add new data through shared queries only when all consumers require it.

## FAQ

**Why can a card be stale?** Stale-on-error keeps README images available when GitHub or Redis is degraded.

**Why does a fine-grained token fail for its owner?** Repository selection can restrict aggregate owner queries. A dedicated classic token with no scopes is simpler for public-only statistics.

**Are Studio layouts uploaded?** No. They stay in browser localStorage unless the user explicitly exports them.

**Why are internal metrics not public?** Operational counters can reveal traffic and failure patterns; the endpoint shares cron bearer protection and disables caching.

**How are deploy previews created?** Vercel's Git integration creates them after CI. Production promotion should be gated by protected-branch checks.

## Private activity setup

Create a fine-grained PAT owned by `dimitrisnimas`, select only the private repositories that may appear publicly, and grant read-only repository Contents access. Set `REPOPULSE_PRIVATE_GITHUB_TOKEN` in Vercel and set `REPOPULSE_PRIVATE_REPOSITORIES` to comma-separated `dimitrisnimas/repository` values. Embed `![Private activity](https://repopulse.kubik.gr/api/cards/private-activity?theme=midnight&width=680)` in the profile README. The card reports complete default-branch commit activity rather than a rolling date window. The three-hour fresh cache keeps GitHub traffic low.
