# RepoPulse architecture

One personal application, one private activity card, one NestJS module. The
operator-approved scope replaces the old Next.js website and eight-card service.
The original [rewrite audit](docs/REWRITE_AUDIT.md) is retained as historical context;
its broader proposed features are not part of this application.

## Runtime

```text
src/main.ts
  → validated config → Nest bootstrap → default operator guard
  → activity controller → activity service (one bounded snapshot)
  → GitHub client (one fixed batch per owner)
  → normalized activity data → pure SVG renderer → HTTP response
```

| File                                       | Responsibility                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `config.ts`                                | Validate credentials, explicit owner/repository scope, publication and presentation   |
| `main.ts`, `bootstrap.ts`, `app.module.ts` | One-time Nest initialization, security headers and providers                          |
| `security.ts`                              | Default-deny bearer guard with explicit health/SVG publication exceptions             |
| `github.client.ts`                         | Fixed GraphQL origin, owner-specific tokens, bounded body, deadlines, parsing         |
| `activity.service.ts`                      | Complete snapshot, five-minute TTL, concurrent-request deduplication, failure backoff |
| `render.ts`                                | Pure self-contained SVG; XML escaping, bounded layout, safe colors                    |
| `activity.controller.ts`                   | Health, SVG and protected JSON responses                                              |
| `errors.ts`, `http.filter.ts`              | Safe error categories, status/headers, sanitized logs                                 |

## Decisions

**NestJS + Node on Vercel.** Retains the requested backend framework while removing
Next/React. Native Vercel detection uses `src/main.ts`; helper modules must not
shadow recognized entrypoint names such as `src/app.ts`. No custom serverless
wrapper, per-request Nest bootstrap, Edge runtime, or persistent process assumption.

**Fine-grained PAT per owner.** The simplest credential setup for one operator and
up to two owners. Selected repositories, Contents read and implicit Metadata read;
no writes or additional repository permissions. Organization policy must permit
the credential. GitHub App tokens are a future alternative if policy/rotation needs
justify the signing and installation lifecycle. No OAuth, callbacks, user accounts,
or credential database. GitHub tokens never authenticate the operator's HTTP requests.

**Fixed configured scope.** At most twelve explicit owner/repository references.
There is no discovery endpoint, repository selector, generic GitHub proxy, or card
registry. Credential routing never falls back across owners. Canonical GitHub refs
must match configuration; a rename/transfer requires an explicit configuration edit.

**One card, three routes.** `/health` is public. `/activity.json` is always protected.
`/activity.svg` is protected unless `REPOPULSE_PUBLISH_ACTIVITY=true`. No query options.
The publication switch explicitly publishes the complete configured card; it is
not an authorization shortcut on private JSON. GitHub README images cannot attach
operator credentials. No signed URLs or secrets embedded in README links.

**Small upstream workload.** Each owner has one GraphQL batch built from fixed
fragments and variables, querying history total/latest committed date plus identity
and language. No repository listing, file reads, author tracking, pagination or
REST client is needed. Missing/invalid/partial data fail the card. Empty branches
are represented honestly as zero commits and no date.

**Bounded transient work.** Six seconds per attempt, one transient retry, fifteen
seconds overall, 128 KiB maximum upstream body, two owner batches, twelve rows.
No automatic redirects. Rate limits are errors with bounded Retry-After, not sleeps
until quota reset. A short failure backoff prevents repeated misses from immediately
retrying GitHub on the same warm instance.

**One snapshot cache.** Five-minute TTL and one shared in-flight promise. No Redis,
cron, self-fetching, background work, distributed locks, stale data fallback, or
variant keys. Origin errors never become cached success. Authorization precedes
cache access. Private HTTP output and errors are no-store; published SVGs may be
CDN-cached for five minutes. Caches and backoff are instance-local, not a global
rate guarantee. Deploying new config resets origin policy/state, but public cached
copies can outlive changes. Previously published information cannot be recalled.

**SVG without a browser.** Fixed width, height bounded by twelve rows, system fonts,
no remote assets or temporary files. Text is escaped and colors validated. The
renderer caps output size at 100 KB. Exact font appearance depends on the viewer;
identical data and options produce identical SVG bytes.

**Public source safeguards.** No tracked credentials or real private examples;
`.env` remains ignored. Tests were removed at the operator's request; the repository
does not ship a test suite. CI uses a frozen lockfile, lint/typecheck/build,
formatting, dependency audit, and CodeQL. The SVG example uses synthetic data.
Review actual production token scope and deployment protection separately.

No database, UI, other card types, generic statistics service, teams, roles,
subscription logic, or infrastructure from other projects is needed.
