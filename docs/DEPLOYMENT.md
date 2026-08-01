# Deployment guide

Deploy the repository root to Vercel with pnpm 10 and a frozen lockfile. Configure `NEXT_PUBLIC_APP_URL`, a public-data GitHub token, Upstash REST credentials, and a random `CRON_SECRET` of at least 16 characters. Use Production, Preview, and Development scopes deliberately.

Before production, run `pnpm check`, verify `/api/health`, `/api/readiness`, and one cold plus warm card request. Confirm HTTPS, the custom domain, Redis connectivity, cron authorization, cache HIT headers, ETags, CSP, and request IDs. Configure uptime checks for health/readiness and alerts for elevated 5xx, GitHub latency, rate limiting, and low cache-hit ratio.

Vercel owns deployment previews through its Git integration. Production deployment should require the CI workflow and protected `main` branch; do not deploy from an unverified local working tree.
