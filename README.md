# RepoPulse

Beautiful GitHub metrics. Built to stay online.

RepoPulse is a private-source, free GitHub statistics card service. It retrieves public profile data through GitHub GraphQL, normalizes the result, renders a standalone SVG, and serves it through a cache-aware public endpoint.

## README usage

```md
![RepoPulse GitHub Stats](https://repopulse.kubik.gr/api/cards/overview?username=dimitrisnimas)
![Top Languages](https://repopulse.kubik.gr/api/cards/languages?username=dimitrisnimas)
![Contributions](https://repopulse.kubik.gr/api/cards/contributions?username=dimitrisnimas)
![GitHub Streak](https://repopulse.kubik.gr/api/cards/streak?username=dimitrisnimas)
![Repository](https://repopulse.kubik.gr/api/cards/repository?owner=dimitrisnimas&repo=repository-name)
![Developer Profile](https://repopulse.kubik.gr/api/cards/profile?username=dimitrisnimas)
![Pinned Repositories](https://repopulse.kubik.gr/api/cards/pinned?username=dimitrisnimas)
```

Example URL:

```text
https://repopulse.kubik.gr/api/cards/overview?username=dimitrisnimas&theme=github-dark&width=520&show_avatar=true
```

## Local development

Requirements: Node.js 20.9+ and pnpm.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The website works without Redis. The card endpoint needs `GITHUB_TOKEN` to retrieve live data.

## GitHub token

1. Create a fine-grained personal access token in GitHub settings.
2. Grant it read-only access to public repositories and public profile data only.
3. Do not select private repositories.
4. Set `GITHUB_TOKEN` in `.env.local` and in Vercel.

The token is read exclusively by server modules and is never included in browser code, SVG output, logs, or response headers.

## Upstash Redis

Redis is optional locally but recommended in production:

1. Create an Upstash Redis database.
2. Copy its REST URL and REST token.
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Without Redis, RepoPulse uses process-local memory. Cache failures degrade safely to GitHub retrieval rather than breaking the endpoint.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public application origin | `https://repopulse.kubik.gr` |
| `GITHUB_TOKEN` | Server-only GitHub GraphQL credential | — |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint | optional |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST credential | optional |
| `REPOPULSE_CACHE_TTL_SECONDS` | Fresh SVG lifetime | `3600` |
| `REPOPULSE_STALE_TTL_SECONDS` | Stale fallback lifetime | `86400` |
| `REPOPULSE_RATE_LIMIT_REQUESTS` | Uncached requests per window | `60` |
| `REPOPULSE_RATE_LIMIT_WINDOW_SECONDS` | Rate-limit window | `60` |

## Card APIs

- `GET /api/cards/overview`
- `GET /api/cards/languages`
- `GET /api/cards/contributions`
- `GET /api/cards/streak`
- `GET /api/cards/repository`
- `GET /api/cards/profile`
- `GET /api/cards/pinned`

Required: `username`

Optional:

- `theme`: `dark`, `light`, `github-dark`, `github-light`, `midnight`
- `width`: `320`–`900`
- `show_avatar`: `true`, `false`, `1`, `0`
- `show_icons`: `true`, `false`, `1`, `0`
- `hide_border`: `true`, `false`, `1`, `0`
- `hide`: comma-separated `contributions,repositories,stars,forks,pull_requests,commits,followers,languages`
- `locale`: `en`, `el`, `de`, `fr`, `es`, `it`, `pt`, `ja`

Every response is SVG, including validation, missing-user, rate-limit, and service errors. Cache state is exposed through `X-RepoPulse-Cache: HIT|MISS|STALE`.

Languages supports `layout=default|compact|donut`, `langs_count`, `exclude`, and `hide_progress`. Contributions supports `year`, `show_total`, `show_legend`, and `show_weekdays`. Streak supports `year` and `show_ring`. See `/docs` for the complete parameter reference and calculation methodology.

Repository cards accept `owner`, `repo`, metric visibility, topics and license controls. Profile cards emphasize public developer identity fields. Pinned cards use the public GitHub pinned-items connection and support one or two columns with a limit of one to six repositories. Private and inaccessible repositories always receive a generic not-found SVG.

## Reliability and diagnostics

Safe GitHub requests use bounded retries, explicit timeouts and an in-memory circuit breaker. Rendered SVGs use fresh and stale cache windows, in-process promise deduplication and an optional short Redis lock. Stale cards are returned immediately during upstream trouble instead of breaking README images.

- `GET /api/health`: inexpensive process liveness.
- `GET /api/readiness`: GitHub configuration, optional Redis availability and circuit state.
- `GET /api/status`: safe public service/card inventory.
- `GET /api/internal/refresh`: authenticated, bounded Vercel Cron refresh using `Authorization: Bearer $CRON_SECRET`.

`vercel.json` schedules the refresh route hourly. Set `CRON_SECRET` in Vercel; never place its value in source control. Serverless memory is instance-local, so Upstash Redis is recommended for production cache sharing and distributed locks.

GitHub may cache README images, so updated data may not appear immediately even after the RepoPulse cache refreshes.

## Architecture

- `src/app/api/cards`: HTTP validation, status codes, safe response headers, and orchestration.
- `src/server/github`: typed fixed GraphQL queries, client errors, and full repository pagination.
- `src/server/cards`: normalized card models, mapping, SVG utilities, themes, and renderers.
- `src/server/cache`: Redis-compatible cache-aside storage with memory fallback and stale serving.
- `src/server/rate-limit`: Redis-backed IP limits with a safe local fallback.
- `src/server/observability`: structured Vercel-friendly operational logs.
- `src/components/playground`: debounced client configuration and live SVG preview.

Raw GitHub response objects never reach the renderer. Route handlers contain neither GraphQL queries nor SVG templates.

## Validation

```bash
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

Tests never call GitHub. They cover validation, language aggregation, exclusions, donut segments, contribution normalization, month placement, UTC year rules, streak boundary cases, XML safety, cache keys, SVG rendering, error output, and rate limiting.

## Vercel deployment

1. Import the repository into Vercel from the project root.
2. Keep the Next.js framework preset and default output directory.
3. Add the environment variables listed above.
4. Set `repopulse.kubik.gr` as the production domain.
5. Deploy and verify `/api/health` and all four `/api/cards/*` endpoints.

## Known limitations

- Contribution data is limited to what GitHub exposes to the authenticated server token.
- Avatar rendering depends on GitHub's image host and remains optional.
- In-memory fallback is process-local and is not shared across serverless instances.
- GitHub and GitHub's README image proxy may each add their own caching delay.
- Language totals use the language data exposed for owned, non-fork public repositories.

## Intentionally deferred

OAuth; private statistics; accounts; database entities; saved presets; dashboard analytics; API keys; arbitrary/custom themes and colors; PNG generation; banners; organization analytics; GitLab, Bitbucket and Azure DevOps; subscriptions and payments.
