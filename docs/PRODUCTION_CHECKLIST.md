# Production checklist

- [ ] Rotate and scope GitHub, Redis, and cron credentials; verify none exist in Git history.
- [ ] Require CI and review on the production branch.
- [ ] Verify HTTPS, canonical domain, HSTS, CSP, referrer, permissions, and MIME headers.
- [ ] Verify cold MISS, warm HIT, stale fallback, ETag `304`, rate limits, and distributed locks.
- [ ] Verify health, readiness, status, protected metrics, and daily refresh cron.
- [ ] Configure uptime, latency, error-rate, cache-ratio, GitHub-rate-limit, and Redis alerts.
- [ ] Define Redis retention/backups and credential-rotation ownership.
- [ ] Run authorized 100/500/1000/5000 request stress tests and record capacity limits.
- [ ] Run Lighthouse for `/`, `/playground`, and `/studio`; retain reports as release artifacts.
- [ ] Confirm version, rollback procedure, incident contacts, and post-deploy smoke checks.
