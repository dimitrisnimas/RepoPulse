# RepoPulse rewrite: audit, architecture, and migration plan

Historical record: the tests described in this audit were subsequently removed
at the operator's request. Current commands and supported behavior are in the root README.

**Follow-up security finding (2026-09-13):** the later all-commit pattern scan found
a GitHub PAT-shaped `GITHUB_TOKEN` value in historical `.env.example` files. See
the current root `SECURITY.md` for affected commits and required revocation. The
original audit's limited HEAD/path checks below were not an all-history secret scan.

Status: scope revised and implementation authorized by the operator on 2026-09-13.
The original audit below is retained as historical evidence, not the final feature list.

## Accepted scope revision — one private activity card

The operator requested only the private activity card, a small personal application,
and appropriate hardening for a public source repository. This section supersedes
the broader API, multi-card registry, publication manifest, discovery, and migration
scope proposed below. Those features will not be implemented.

- One stateless NestJS app, one module, one GitHub client, one activity service,
  one pure SVG renderer. No frontend, other cards, database, Redis, cron, or discovery.
- Three GET routes: `/health`, `/activity.svg`, and protected `/activity.json` for
  the same card data. No query parameters or user-selected repositories.
- At most 12 explicit `owner/repository` references from deployment configuration.
  Personal and optional organization fine-grained PATs are routed strictly by owner.
  Contents read plus implicit Metadata read are sufficient for the queried history.
- A separate operator bearer secret protects both activity routes by default.
  `REPOPULSE_PUBLISH_ACTIVITY=true` explicitly makes only the SVG public for README
  embedding. This publishes every configured row's name, description, language,
  commit count and latest date. JSON remains protected. No URL secret or signed link.
- Fixed presentation settings from environment; no public variant/key explosion.
  One fixed query batch per configured owner, fixed API origin, no redirects,
  schema-validated bounded response, timeouts and one bounded transient retry.
- One five-minute in-memory snapshot with promise deduplication; no stale-on-error.
  An incomplete batch fails coherently. No shared HTTP caching for private data or
  errors; short CDN caching only when SVG publication is explicitly enabled.
- Use only native SVG, no remote images/fonts, browser, native image libraries,
  filesystem state, or background work. Preserve the useful activity-card look.
- Test configuration, owner isolation, authorization, upstream errors/budgets,
  rendering injection, cache behavior, and actual Nest HTTP responses. Replace the
  old README/deployment/CI configuration to match this single-card application.

Implementation stages: minimal Nest foundation; config/auth; bounded GitHub batch
client; activity model/renderer; tests and example; legacy removal; build/security
verification. Deployment and entering real credentials remain operator actions.

## Historical audit and broader proposal
Audit date: 2026-09-13. Scope: the checked-out repository, including application,
cards, integrations, tests, configuration, documentation, scripts, and workflows.

## Executive decisions

RepoPulse should become one stateless NestJS/TypeScript API on Vercel, with pure
SVG renderers and no frontend, database, Redis, cron, accounts, or login flow.
The current checkout is **Next.js, not NestJS**. NestJS must be introduced; there
is no existing Nest application to retain.

Use two owner-scoped fine-grained GitHub PATs initially: one for the personal
account and one for KUBIK. Route credentials by an explicit owner allowlist.
Protect all data and ad-hoc rendering endpoints with a separate operator bearer
secret. PATs are upstream credentials, not client credentials.

README delivery is a publication decision. A protected image endpoint cannot be
embedded directly through GitHub's image proxy with an Authorization header.
Provide a small, explicit public-card manifest for approved public repository
cards. Private-derived publication is disabled by default and requires a
reviewed field projection for each published card. An unlisted URL is not private.
Confidential output stays behind bearer authentication and can be downloaded
locally. Publishing a downloaded file also publishes its contents.

These decisions are proposals, not changes already made to the running service.

## Phase 1 — Repository audit

### 1. Current architecture and runtime

`src/app` is a Next.js 16 App Router application using React 19. Server code is
organized under `src/server`, but uses functions and Next route handlers rather
than Nest modules, controllers, guards, or dependency injection.

The normal card flow is:

1. A README image, playground, or browser calls a card GET route.
2. The route delegates to `src/server/cards/card-route.ts`.
3. URL limits and strict Zod schemas validate query parameters.
4. A normalized key looks up an SVG in optional Upstash Redis, then process memory.
5. Fresh cached responses return immediately; stale responses normally also return
   immediately, without launching a refresh.
6. On a miss, an IP limiter, process promise map, and optional Redis lock gate work.
7. GitHub GraphQL/REST functions fetch data; mappers prepare renderer models.
8. String-template renderers generate SVG. The result is cached and returned with
   an ETag, public cache headers, CSP, and request ID.

There is a second path: a daily Vercel cron reads remembered card URLs and makes
HTTP requests back into the application with a refresh header. Contributions
also cache normalized JSON through helpers named `getCachedSvg`/`setCachedSvg`.

### 2. Current functionality

Actual API functionality comprises eight SVG cards and five diagnostic/internal
endpoints. There is no repository JSON statistics endpoint, repository discovery
API, server-side combined card, OAuth flow, session, user database, or payment
integration.

The website includes `/`, `/pricing`, `/docs`, `/docs/studio`, `/playground`,
`/studio`, and `/dashboard`, plus robots, sitemap, favicon, and static assets.
The dashboard's metrics and GitHub connection are placeholders. Pricing describes
future plans; it does not implement subscriptions. Studio is a client-side README
editor with presets, templates, undo/redo, preview, JSON import, Markdown/HTML/JSON
export, and localStorage persistence. Its “canvas” is UI layout, not a server image
renderer. Some Studio URLs point at unimplemented `/originals/*.svg` routes, and
its repository-card URL incorrectly supplies username instead of owner/repo.
The playground's refresh button adds an unsupported `refresh` query parameter,
which the strict card schemas reject.

### 3. Complete current API inventory

All explicitly implemented methods below are GET. Next may supply framework HEAD
or OPTIONS behavior; these are not additional application features.

| Route | Input / purpose | Access |
| --- | --- | --- |
| `/api/cards/overview` | username; profile metrics and languages | Public |
| `/api/cards/languages` | username; language bars/compact/donut, exclusions | Public |
| `/api/cards/contributions` | username, optional year; heatmap | Public |
| `/api/cards/streak` | username, optional year; current/longest streak | Public |
| `/api/cards/repository` | owner and repo; repository summary | Public; rejects non-public repositories |
| `/api/cards/profile` | username; developer identity and metrics | Public |
| `/api/cards/pinned` | username, limit 1–6, columns 1–2 | Public |
| `/api/cards/private-activity` | appearance only; server-configured repositories | **Public despite private upstream data** |
| `/api/health` | process liveness, version, timestamp | Public |
| `/api/readiness` | configuration presence, Redis PING, circuit state | Public |
| `/api/status` | static operational status and eight-card inventory | Public |
| `/api/internal/metrics` | per-instance counters and sampled latency | `CRON_SECRET` bearer |
| `/api/internal/refresh` | sequential self-fetch of remembered cards | `CRON_SECRET` bearer |

Card schemas expose fixed themes, locales, widths and visibility options. Most
widths are 320–900; contributions are 500–1000. Unsupported or duplicate parameters
are rejected. Errors are SVG, but unknown routes retain Next's behavior. The
shared validation error defaults to asking for a username, including malformed
repository requests. API documentation is inconsistent about card counts and
required parameters.

### 4. GitHub integrations and discovery

`github-client.ts` posts fixed queries to `https://api.github.com/graphql` with
`GITHUB_TOKEN`, an abort timeout, bounded transient retries, and a shared circuit.
`github-rest.ts` gets public profile details from `/users/{username}`. Avatar
embedding fetches GitHub-hosted raster images and converts them to data URLs.

`github-service.ts` discovers owned **public non-fork** repositories with
`user.repositories(first:100)` and cursor pagination. Pagination has no total page
or elapsed-time budget. Queries fetch only the ten largest languages per repository.
The repository-specific query already uses explicit owner/name and works for public
organization repositories. User profile queries cannot be used as organization
queries. There is no organization discovery service.

Private activity uses a separate `REPOPULSE_PRIVATE_GITHUB_TOKEN`, a maximum of
12 configured names, and a hard-coded owner (`dimitrisnimas`). Although configuration
accepts owner/repository strings, other owners are rejected and the owner is then
discarded. It makes one concurrent query per selected repository. Missing entries
are omitted, with an unavailable count. The query does not enforce private visibility.

### 5. Authentication and authorization

There is no GitHub OAuth, GitHub App, browser authentication, registration, or
operator API authentication. The two GitHub credentials are environment variables.
The main README recommends a public-only classic PAT; the private card documentation
recommends a selected-repository fine-grained PAT with Contents read.

The private activity endpoint intentionally publishes repository names, configured
descriptions, language, default-branch commit counts, and latest commit dates.
This was documented as old behavior, but conflicts with the new personal-only
private functionality requirement. A configured repository allowlist restricts
*what can be fetched*; it does not restrict *who can read the resulting image*.

Internal routes share `CRON_SECRET`. `secureCompareBearer` manually compares bytes
and accepts the raw secret without a Bearer prefix because prefix removal is
optional. Replace it with strict scheme parsing and Node's timing-safe comparison.

### 6. Card data, calculations, and rendering

Let P be the number of profile repository pages, minimum one. Counts below exclude
cache lookups, retries, and optional avatar downloads.

| Card | Required data / upstream calls on miss | Calculation and rendering |
| --- | --- | --- |
| Overview | Profile, contributions summary, every owned public non-fork repository; P GraphQL calls | Sums stars/forks; API contribution counts; byte-weighted top five languages; metric grid and bars |
| Languages | Same broad profile query; P calls | Excludes archived repositories, applies exclusions, sums returned language bytes, top N; bars, compact rows, donut |
| Contributions | One dated contribution-calendar query | Maps levels and week/day positions; rectangular heatmap; one normalized data cache |
| Streak | Same calendar, potentially shared cache | Sorts/deduplicates days; positive contiguous UTC days; today or yesterday anchors current streak; rings and values |
| Repository | One repository GraphQL query | Maps metadata, open issue count, stars, forks, topics, license, flags; summary SVG |
| Profile | P GraphQL calls plus one REST call | Identity, followers, repository totals, contribution count, shared language calculation; optional avatar |
| Pinned | One pinnedItems query | Filters repository nodes, limits to six; one/two-column summaries |
| Private activity | N GraphQL calls, N ≤ 12 | Default-branch reachable history total and latest committedDate; rows sorted by latest date and summed count |

Important semantic limits:

- Commit history totals are not the operator's commits, all-branch unique commits,
  or time-window activity. Summing repositories can double-count shared history.
- Contribution calendars are user activity, not individual repository statistics.
  The selected year bounds streak history; a January streak can be truncated.
- Overview/profile language aggregation includes archived repositories; the
  languages card excludes them. All use only the first ten languages upstream.
- Top-N percentages can sum below 100%; truncation is not a complete language mix.
- Owned non-fork repository count is labeled generically as repositories.
- Fields such as watchers, creation time, homepage, and default branch are fetched
  for repository cards even when they are not displayed.

Every server card uses handwritten SVG strings, shared `svgDocument`, XML escaping,
themes, number formatting, and geometry. There is no PNG endpoint, browser,
HTML-to-image, canvas, or explicit image-generation package. Sharp is a Next.js
transitive dependency. Fonts are system fallback names; no font files are bundled.
The shared stylesheet has extra closing braces in text/muted/accent rules. Several
renderers duplicate layout/icon/text handling and directly interpolate GitHub color
values instead of using `safeColor`. There are potential narrow-width collisions,
especially repository badges/license/language and fixed-height donut legends.

### 7. Dependencies and tooling

| Direct dependency | Current purpose | Rewrite disposition |
| --- | --- | --- |
| next 16.2.12 | Frontend, routing, HTTP responses, build | Remove |
| react / react-dom 19.2.4 | Website and Studio | Remove |
| lucide-react ^0.468.0 | Frontend icons | Remove; keep small SVG paths where useful |
| zod ^4.4.3 | Input/config/Studio validation | Keep for API/config and selected upstream schemas |
| typescript ^5, @types/node ^20 | Language and Node types | Keep; align Node types/runtime |
| @types/react, @types/react-dom | React types | Remove |
| tailwindcss, @tailwindcss/postcss | Frontend CSS build | Remove |
| eslint ^9, eslint-config-next | Linting and Next rules | Keep ESLint; replace Next config with TS configuration |
| prettier, prettier-plugin-tailwindcss | Formatting and class ordering | Keep Prettier only |
| vitest ^4.1.10 | Unit tests with path alias | Keep; configure decorator-compatible compilation for Nest tests |

There is no Octokit, Nest, Prisma, database driver, Redis SDK, or authentication SDK.
Redis uses native fetch. `pnpm-workspace.yaml` overrides sharp and postcss and allows
native builds. The checked-in lock still contains sharp 0.34.5 and Next's postcss
8.4.31, while overrides request sharp 0.35.0 and postcss 8.5.25. Therefore overrides
alone are not evidence of a patched resolved tree. CI and Vercel use non-frozen
installs, contradicting contributor/deployment documentation.

Add only Nest common/core/platform-express, reflect-metadata and rxjs as the
framework runtime set, plus necessary TypeScript build/test tooling. Express is
Nest's adapter, not a replacement architecture. Avoid separate validation stacks,
ORMs, a GraphQL server, and a general GitHub SDK unless authentication later warrants it.

### 8. Infrastructure and serverless behavior

Vercel currently uses Next detection and one daily cron. Upstash REST supplies
shared SVG/data caching, rate buckets, locks, and recent URLs when configured.
Fallback state is process-local. GitHub Actions runs lint/typecheck/tests/build,
dependency audit, and a public-repository CodeQL workflow. `scripts/stress.mjs` is a
manual HTTP load script. No containers, queues, migrations, persistent workers,
database, or external KUBIK infrastructure exist.

Current problems include sequential cron work potentially exceeding function
duration, unbounded profile pagination, cumulative retry/cache latency, and a
fire-and-forget URL registration that can be interrupted after response completion.
Memory metrics are not fleet metrics. A 500-entry cache can still hold roughly
500 MB of SVG text before runtime overhead. Redis locks expire without explicit
release and their wait window can be shorter than generation time.

### 9. Problems and security findings

Findings below are code observations, not claims of production exploitation.

| Priority | Finding and evidence | Required treatment |
| --- | --- | --- |
| High | Public private-data output and shared CDN caching: private-activity route plus shared card response headers | Protect private routes before cache lookup; publish only explicit projections |
| High | All card errors inherit public one-hour shared cache and stale headers | `no-store` for errors, authentication, and confidential output |
| Medium | Public `x-repopulse-refresh: cron` can bypass the stale shortcut without cron authentication | Remove public refresh control and self-fetch cron |
| Medium | Avatar redirects are checked only after fetch follows them; body limit is checked after full buffering | Reject redirects before following; stream with byte limit; exact host allowlist |
| Medium | GraphQL/REST rate and authorization mappings differ; GraphQL rate errors in HTTP 200 can become generic 503; REST 401/403 lack useful categories | One upstream error model; primary/secondary rate handling and retry deadlines |
| Medium | Profile pagination and concurrent private queries lack a whole-request work budget | Bounded pages, concurrency, body size, and elapsed time |
| Medium | Runtime GitHub responses are TypeScript assertions; several color/date fields reach SVG without boundary validation | Validate consumed data and every attribute/text boundary |
| Medium | Studio HTML export escapes text but not quotes in attributes; Markdown HTML branches interpolate URLs/titles | Remove Studio; do not reuse its exporter |
| Medium | Non-frozen installs and override/lock mismatch prevent reproducible vulnerability assessment | Regenerate once, inspect resolved tree, restore frozen CI |
| Low | Stale cache is normally returned until expiry even if upstream recovered; daily refresh is not stale-while-revalidate | Use simple foreground refresh on expiry |
| Low | Shared circuit can affect unrelated owners; half-open probe errors outside unavailable category do not clear testing flag | Remove circuit initially; use bounded retry and quota handling |
| Low | Cache keys lowercase arbitrary text, contain private descriptions/names, and do not represent credential/access revisions | Separate access domains; hash sensitive normalized configuration |
| Low | Readiness checks token presence, not effective permission; status always says operational | Keep dependency-free health; diagnose access through protected requests |

Existing strengths: strict query schemas, duplicate/control-character rejection,
fixed GitHub API hosts and query variables, XML escaping helpers, bounded card
dimensions, generic repository not-found behavior, server-side credentials, and
meaningful calculation/security tests. No request-to-shell execution or dynamic
filesystem path operation was found in the API. The avatar issue is a redirect
defense gap, not evidence that arbitrary initial URLs pass the host check.

`.env` exists locally and is ignored; only `.env.example` is tracked among inspected
environment/key paths. Its real values were not printed or used. A tracked-source
pattern scan found no common GitHub token/private-key signatures. Available history
path checks found no `.env`, `.env.local`, PEM, or KEY files. This is not a complete
all-history secret scan and cannot certify absence of generic/deleted secrets.
The example file contains unnecessarily specific ecosystem names/descriptions;
replace these with neutral examples. Do not log arbitrary exception messages,
tokens, full URLs, private owner/repository names, or raw upstream bodies.

### 10. Keep and remove

Keep card visual concepts, themes, useful visibility controls, pure statistics
functions, selected render helpers, fixed-query techniques, meaningful tests,
TypeScript, Zod, Vitest, basic structured logs, and CI/CodeQL concepts.

Remove all Next/React pages/components/Studio, pricing/dashboard promises, website
SEO and starter assets, old routes, cache/lock/cron/metrics infrastructure,
placeholder db/repositories/services/validators directories, obsolete types,
frontend dependencies, old environment variables, hard-coded identity/branding,
and incompatible documentation. There are no real accounts, database models, or
OAuth sessions to migrate. Preserve Git history rather than a second legacy runtime.

## Phase 2 — Target architecture

### 1. Shape and responsibilities

One Nest application. Three feature areas: GitHub, repositories, and cards. Small
pure files implement calculations and rendering without extra Nest modules.

```text
src/
  main.ts                     # documented Vercel Nest entrypoint
  app.module.ts
  health.controller.ts
  config/
    config.ts                 # startup schema and immutable parsed values
    publication.ts            # validate public-card manifest
  auth/
    operator.guard.ts         # default deny; explicit public exceptions
  github/
    github.module.ts
    github.client.ts          # fixed origins, deadlines, error normalization
    github.credentials.ts     # explicit owner -> configured credential
    github.queries.ts         # fixed, feature-specific GraphQL documents
    github.types.ts
  repositories/
    repositories.module.ts
    repositories.controller.ts
    repositories.service.ts   # normalize lookup/discovery and enforce scope
    repositories.types.ts
  stats/
    languages.ts
    streaks.ts
    repository.ts
  cards/
    cards.module.ts
    cards.controller.ts
    cards.service.ts          # select data needs and public projection
    cards.types.ts
    repository/               # model + pure renderer
    languages/
    activity/
    overview/
    profile/
    pinned/
    contributions/
    streak/
    combined.ts               # bounded SVG composition
  rendering/
    svg.ts                    # safe document, IDs, text and attribute helpers
    themes.ts
  common/
    validation.pipe.ts
    exceptions.filter.ts
    memory-cache.ts           # byte/entry bounded TTL + promise deduplication
test/
  fixtures/                   # synthetic public/private GitHub payloads
  api.test.ts
docs/examples/                # generated, non-sensitive sample SVGs
ARCHITECTURE.md
README.md
.env.example
```

Why this: Nest handles HTTP boundaries and dependency injection; normal functions
handle calculations and SVG. No service/repository interface pair without a real
second implementation. No separate module for each tiny utility or card.

### 2. Authentication decision

**Initial choice: two fine-grained PATs, selected repositories, read-only permissions.**
The personal token's resource owner is the operator; the organization token's
resource owner is the actual KUBIK GitHub login. Both remain server-only environment
secrets. Verify organization approval and policy before deployment; do not infer
the GitHub login from the display name or substitute a broader token on failure.

Why this: one operator and two owners do not require OAuth sessions, signing keys,
installation discovery, refresh-token persistence, or user accounts. A fine-grained
PAT is limited to one resource owner, so one token is not the proposed solution
for both accounts. Expiration and rotation are an explicit maintenance obligation.
[GitHub PAT documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

| Alternative | Assessment |
| --- | --- |
| Classic PAT with repo scope | Convenient across owners but excessive private repository/write exposure; reject |
| OAuth app | Browser consent/callback/session lifecycle and broad user grants do not solve a single-operator requirement more simply; reject |
| GitHub App installation tokens | Strong long-lived service option, selected repositories, short-lived tokens, installation-specific quotas; choose if KUBIK policy requires it or manual PAT rotation becomes a problem |
| One GitHub App per owner | Avoids cross-account installation availability but doubles registrations/keys; unnecessary initially |

An App is a valid security-oriented alternative, not SaaS infrastructure. One App
would have one selected-repository installation per owner, a fixed owner-to-installation
map, and in-memory tokens renewed before expiry. Installation tokens expire after
one hour. Its private key remains a long-lived credential with access to both
installations. A GitHub App restricted to installation only on its owning account
cannot cover both owners: a single cross-account App must allow installation on
other accounts, while RepoPulse still rejects unconfigured installations. No
webhooks, OAuth callbacks, or user database would be needed. Use a maintained
GitHub auth helper instead of homemade JWT signing if that alternative is selected.
See [installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app),
[App availability](https://docs.github.com/en/enterprise-cloud%40latest/apps/creating-github-apps/registering-a-github-app/making-a-github-app-public-or-private),
and [App versus OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps).

Minimum proposed repository permissions: Metadata read for lookup/languages,
Issues read for issue counts, Contents read for commit history, and Pull requests
read only if a PR metric is enabled. No write, administration, secrets, workflows,
or organization-members permissions. Validate actual GraphQL fields against test
repositories under both credentials; missing permissions must not become zero.
Contents read permits source access even when our queries never request source.
Document that distinction and select only intended repositories.

Operator authentication is a separate random 32-byte-or-longer secret sent as
`Authorization: Bearer ...` over HTTPS. Global guard, timing-safe comparison,
strict scheme, bounded header, no cookies, no URL/query secrets, no login endpoint.
Protect before cache or GitHub access, including HEAD. No browser CORS requirement.

### 3. Repository scope and discovery

Use a `RepositoryRef` with owner and name; preserve canonical GitHub casing for
display and normalize case only for identity comparison. Explicit config records
whether each owner is personal or organization; this is configuration, not tenancy.
Never try the other token after a permission failure. Reject unknown owners before
upstream work. A server-side allowed-repository list narrows access further than
the PAT; discovery returns only its intersection with credential-visible results.

Discovery uses a one-page GraphQL owner repository connection (`user` or
`organization` according to configuration), with a maximum page size of 100 and
an opaque validated next cursor. It requests identity/visibility only. For a known
repository use direct lookup, avoiding listing every repository first. No search
endpoint or ambiguous name-only lookup. Explicit visibility is carried throughout
normalized data, but never grants public access by itself.

### 4. Small API

| Proposed route | Response | Policy |
| --- | --- | --- |
| `GET /health` | `{status:"ok"}` | Public, dependency-free, no config detail |
| `GET /repos/:owner?cursor=...` | Bounded page of permitted repository refs | Operator |
| `GET /repo/:owner/:repository/stats` | Documented normalized statistics | Operator |
| `GET /repo/:owner/:repository/cards/:type.svg` | repository, languages, activity, combined | Operator |
| `GET /profile/:username/cards/:type.svg` | overview, profile, pinned, contributions, streak, languages, combined | Operator; configured personal identity only |
| `GET /cards/:id.svg` | Fixed manifest-selected card, including approved combinations | Explicit publication |

Card routes have bounded enumerated theme/width/locale options; combined accepts
at most four known panels for one scope and rejects duplicates. No arbitrary URLs,
GraphQL, templates, markup, colors, or source paths. Public IDs have no query
customization: the manifest fixes source, style, panels, and exposed fields. No
publish/update CRUD API. Configuration changes are reviewed and deployed.

Retain all eight useful existing card concepts, but replace the private-activity
implementation with protected activity rendering for explicit owner/repository
references. Named manifest combinations can arrange several authorized repositories,
maximum 12, with request budgets. Profile-based cards remain explicitly user-scoped;
do not present contribution calendars as organization or repository activity.

### 5. Private output and README publication

Public source code does not imply public access to the deployed API. All statistics,
discovery, private images, and ad-hoc generation remain protected. For README usage,
the operator configures a named published card in an environment manifest. The
default manifest is empty; examples contain fictional/public data only.

For a public repository entry, fetch and verify visibility before generating a new
public representation. Never serve private cache entries through this route. For
private-derived entries, require explicit `publishPrivateMetadata: true` plus a
field allowlist. Project into a separate public model *before rendering and caching*:
titles, descriptions, accessibility text, dates, counts, and error text all count
as output. Source identifiers need not appear merely because they were queried.
No request parameter can enable private publication or change the source.

GitHub's image proxy cannot retrieve an image requiring authentication. Signed URLs
in README source are shareable bearer capabilities, not reader authentication, and
are therefore not the default. Confidential images cannot simultaneously be
universally readable live README images. Explicitly published data can persist in
GitHub/browser/CDN caches after withdrawal; disabling an entry stops future origin
publication but cannot guarantee erasure of copies. Keep public cache TTL modest.
[GitHub image proxy documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls).

### 6. GitHub API strategy and metric contract

Keep a small fixed GraphQL client because repository issue-only counts and
default-branch commit totals can be retrieved directly in one operation. REST's
repository open_issues_count mixes issues and PRs, and enumerating commit pages to
derive counts is wasteful. Use REST for repository language byte totals when
needed, avoiding the current top-ten truncation. No GraphQL server or arbitrary
query endpoint. Review endpoint permissions using the
[repository REST reference](https://docs.github.com/en/rest/repos/repos).

| Target card/data | Planned calls without cache | Shared work |
| --- | --- | --- |
| Repository summary | 1 fixed GraphQL query | Normalized repository summary for stats/combined |
| Repository languages | 1 REST languages call plus summary lookup when identity/visibility is needed | Language data cache; no profile pagination |
| Activity | 1 fixed GraphQL query with default branch history total/latest date | Summary can be included in this query for combined |
| Repository combined | 1 union-of-needed-fields GraphQL query, plus languages REST only when requested | No request per panel |
| Profile identity | 1 focused GraphQL query | Fetch company/location/website there instead of extra REST |
| Contributions / streak | 1 calendar query for selected year | Same normalized calendar and captured reference time |
| Pinned | 1 bounded GraphQL query | Filter visibility and allowed scope explicitly |
| Overview / account languages | Paginated scoped repository data only when aggregate panels require it | Shared aggregation; never silently call a partial total complete |

Account language aggregation must paginate language connections or fetch complete
REST language maps, under the same total budget. Initially cap aggregation at 500
repositories and 50 upstream calls, concurrency three, and a 20-second whole-request
deadline; stop with a clear limit error rather than silently dropping data. Tune
these proposed internal limits after fixture and deployment measurements. Discovery
itself is page-based so larger accounts remain navigable. No assumption that each
overview fits one request. Public manifests should use bounded preselected scopes
when large account-wide calculations exceed budget.

Define stats explicitly: current stars/forks, issue-only open count, language bytes,
default-branch reachable commits, latest default-branch committed date, visibility,
archive/fork/template flags, nullable license/language/branch. Zero means measured
zero; null means unavailable/not applicable. Empty repository history is zero with
null last commit; permission failures are errors. Language totals consistently
exclude archived/fork repositories for account aggregation and label that scope.
Repository language cards analyze their named repository regardless of its fork flag.
Selected-year streaks are labeled year-bounded; do not imply lifetime statistics.

No need for an external cache to deduplicate a combined card: fetch the union of
required data once. Parse consumed upstream values, discard unknown sensitive fields,
bound responses, reject pagination loops, and propagate incomplete upstream results.

### 7. Rendering and composition

Keep standalone SVG strings: small, dependency-light, no browser or native image
runtime, no temporary files. Pure renderer input is a typed card model and validated
options. A small registry selects a model preparation function and renderer; no
base-class hierarchy. Add a card by defining its fields, preparing its model, and
writing its renderer plus meaningful fixtures.

Repair shared CSS. Escape text/attributes, validate colors and finite geometry,
remove invalid XML control characters, bound output to 1 MB of UTF-8 bytes, and
forbid script, handlers, foreignObject, external stylesheets/fonts, and user markup.
Use fixed SVG icon paths and system fonts with conservative layout. Exact glyph
appearance differs by viewer; deterministic SVG bytes do not imply identical fonts.
Default avatars off; optional avatars use exact GitHub avatar host, redirect rejection,
raster MIME validation and a streamed byte limit, then embedded data URLs.

Combined cards compose renderer fragments with measured dimensions, one document
wrapper, and deterministic unique IDs for every title/clipPath. Do not concatenate
full SVG documents or duplicate IDs. Test long text, Unicode, all themes, minimum
width, empty data, and mixed panels visually. No PNG until there is an actual need.

Successful public SVGs get `image/svg+xml; charset=utf-8`, nosniff, restrictive CSP,
ETag, and a short public cache policy. Private SVGs and JSON always get
`Cache-Control: private, no-store`; errors get `no-store`. Set headers explicitly
in Nest rather than relying on the removed Next configuration.

### 8. Caching, errors, logs, and abuse

Begin with a byte-bounded in-memory TTL cache: proposed 100 entries / 16 MiB,
five-minute normalized-data TTL. Deduplicate in-flight requests and remove promises
on every completion path. Keys include access class, credential identity/revision,
owner/name, selected fields, and normalized options; never raw credentials. Public
SVG keys additionally include renderer and publication-policy versions. Private
data cache is an optimization behind the guard; it never changes HTTP confidentiality.

Public cards: proposed `public, max-age=60, s-maxage=300`, with no stale window at
first. Private responses: no CDN caching even when origin data is cached. On expiry,
refresh within the request; no detached work. Authorization/configuration failures
must never use stale data. Permission removal can leave origin data until TTL;
credential revocation and redeployment clear warm state for urgent withdrawal.

For supported REST reads, retain ETags alongside the body and use conditional
requests; do not send If-None-Match when the body is absent. GraphQL POST does not
gain REST conditional-cache semantics. These optimizations reduce quota usage but
do not create a distributed rate guarantee. No Redis, scheduled warming, or locks.
[GitHub REST caching guidance](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api).

Handle API redirects manually with a small hop limit: require HTTPS and the fixed
GitHub API host at each hop, and recheck canonical repository owner/name against
scope after a rename or transfer. Never forward credentials to a returned arbitrary
URL. Avatar redirects remain disabled. Reject encoded separators and traversal
segments before constructing encoded owner/repository path components.

Normalize errors centrally using a Nest exception filter:

| Condition | Status / stable code |
| --- | --- |
| Invalid ref/query/card options | 400 INVALID_REQUEST |
| Missing/wrong operator bearer | 401 UNAUTHORIZED, WWW-Authenticate |
| Unknown owner/repository/public ID or inaccessible repository | 404 NOT_FOUND |
| Unknown card type | 400 INVALID_CARD_TYPE |
| RepoPulse rate limit | 429 RATE_LIMITED |
| Upstream primary/secondary quota exhaustion | 503 GITHUB_RATE_LIMITED, safe Retry-After |
| Invalid/expired upstream credential | 503 GITHUB_AUTH_FAILED |
| Explicit upstream insufficient permission | 503 GITHUB_PERMISSION_DENIED on protected requests; generic failure publicly |
| Upstream failure / invalid payload | 502 GITHUB_UNAVAILABLE |
| Deadline exceeded | 504 UPSTREAM_TIMEOUT |
| Calculation size budget exceeded | 422 SCOPE_TOO_LARGE |
| Rendering/unexpected internal failure | 500 INTERNAL_ERROR |

GitHub can hide private repositories behind 404; never promise to distinguish
missing from inaccessible. JSON errors contain code, safe message and request ID;
SVG endpoints use a generic safe SVG with the real HTTP status. Entire empty
datasets have useful empty-state output. Combined results fail coherently instead
of presenting partial totals as complete; optional avatar failure is tolerated.

Retry only safe reads on transient network/502/503/504 failures, at most once and
only within the total deadline. Respect Retry-After and reset headers; do not sleep
until quota recovery inside a function. Handle GraphQL error payloads even on HTTP
200. Log request ID, route template, duration, cache state, and normalized error code
using Nest Logger. No bodies, raw errors, credentials, private refs, or URLs.

Bound query length, cardinality, work and concurrency. A local limiter can smooth
bursts but is not globally enforceable across Vercel instances. Public manifest IDs
limit cache-key variation and abuse. Use Vercel's available platform protections if
measured public traffic needs stronger enforcement; do not add Redis speculatively.
[GitHub GraphQL limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api).

### 9. Vercel and environment

Use Vercel's native NestJS support and its recognized `src/main.ts` bootstrap,
with the normal Nest Express adapter. Start with the official framework integration
rather than a legacy catch-all serverless wrapper; validate it in a preview before
cutover. Node runtime, not Edge. Pin a supported Node major consistently in engines,
CI, local documentation, and Vercel. Framework detection/build settings must change
from Next, and old cron configuration must be removed.
[Vercel NestJS documentation](https://vercel.com/docs/frameworks/backend/nestjs).

No network activity at startup; validate configuration locally, then fetch lazily.
Bootstrap once per runtime instance; do not build a Nest application per request.
No request identity or mutable current token in singleton state. Concurrent requests
pass immutable credential context explicitly. No persistent filesystem writes,
temporary files, background timers, or streams required. Buffer only bounded SVGs.
Set function duration above the application deadline and confirm deployed cold-start,
memory, concurrency and route behavior. Keep SVG output below the
[function response limit](https://vercel.com/docs/errors/function_response_payload_too_large).

| Environment variable | Requirement |
| --- | --- |
| `NODE_ENV` | Standard environment |
| `PORT` | Local Nest port; default 3000 |
| `REPOPULSE_API_KEY` | Required random operator bearer secret |
| `GITHUB_PERSONAL_OWNER` | Required actual personal login |
| `GITHUB_PERSONAL_TOKEN` | Required selected-repository fine-grained PAT |
| `GITHUB_ORG_OWNER` | Required actual organization login; no guessed KUBIK slug |
| `GITHUB_ORG_TOKEN` | Required organization-approved fine-grained PAT |
| `REPOPULSE_ALLOWED_REPOSITORIES` | Required bounded JSON list of owner/repository refs |
| `REPOPULSE_PUBLIC_CARDS` | Optional bounded JSON publication manifest; default empty |

Parse once with Zod at bootstrap. Reject missing/placeholder secrets, invalid or
duplicate owners, repository refs outside those owners, inconsistent publication
rules, and excessive manifest size. Never print Zod input values. Keep timeout/cache
defaults in code until operational experience justifies more environment knobs.
Version comes from package metadata. `.env.example` uses neutral examples only;
ignore `.env*` except the example and PEM/KEY files. Local Node environment-file
loading avoids another dotenv dependency. Secrets belong in Vercel environment
settings; production credentials must not be available to untrusted PR previews.

If an App replaces PATs after review, substitute app ID/private key and one fixed
installation ID per owner. Do not configure OAuth client secret, PATs, and App keys
simultaneously without a selected mode. No persistent credential store.

### 10. Meaningful testing and documentation

- GitHub: both owner mappings, selected permissions, pagination/loops/budgets,
  public/private/not-found, 401/403/429, HTTP-200 GraphQL errors, timeouts, invalid
  payloads, conditional 304 with retained body, and no cross-owner fallback.
- Statistics: empty repository, missing optional fields, complete language totals,
  exclusions/percentages, archive/fork policy, UTC/year/leap-day streak boundaries,
  and explicit partial-data rejection.
- Cards: escape hostile metadata, invalid colors/dates/control characters, safe
  avatars, dimensions, UTF-8 byte limit, unique composed IDs, private projection,
  and a compact visual fixture set. Preserve useful existing tests, not legacy bugs.
- API: unauthorized requests cannot call GitHub or read caches; public query overrides
  fail; private/public cache separation, errors are no-store, removed cards cannot
  be regenerated, correct SVG/JSON status/headers, HEAD authorization, and owner scope.
- Deployment: local production boot and Vercel preview smoke tests for cold/warm
  requests, parallel requests, no filesystem writes, deadlines and response headers.

Mock GitHub in CI; no production secrets or live calls in unit tests. Use Nest's
testing utilities with meaningful HTTP integration tests. Verify decorator metadata
in the compiled test path; do not assume the current Vitest transform is sufficient.
CI runs frozen install, lint, typecheck, tests, build, and dependency audit. Keep
CodeQL and add a proper history-aware secret scan before public release.

Rewrite README around this personal tool: overview, checked-in synthetic sample
cards, one data-flow diagram, authentication/permissions, both owners, private versus
published output, environment table, local commands, Vercel settings, curl/README
examples, metrics definitions, errors, security, and adding a card. Remove conflicting
old deployment/platform/architecture docs or consolidate them into that README and
this decision record. No fabricated deployment success or live card examples.

## Phase 3 — Migration plan (implementation only after review)

| Stage | Concrete work | Completion gate |
| --- | --- | --- |
| 0. Review | Review this document; confirm PAT policy, actual owner logins, desired public projections, and retention of user-scoped cards | Architecture accepted; never request token values in chat |
| 1. Baseline | Preserve current Git revision; capture synthetic fixtures for every retained card and record semantic changes | Baseline coverage and renderer fixtures; no private data committed |
| 2. Nest foundation | Introduce minimal Nest app, config validation, guard, exception filter and health; prove local and Vercel boot | Auth/headers and cold-start smoke pass; no live cutover |
| 3. GitHub boundary | Implement owner routing, repository scope, focused queries, payload/error validation, deadlines | Mocked two-owner tests and restricted credential setup verified |
| 4. Core repository features | Implement normalized stats, repository/languages/activity cards and bounded composition | Metric, empty-state, privacy and rendering tests pass |
| 5. Retained profile cards | Port overview/profile/pinned/calendar/streak and account languages with explicit scope and pagination semantics | All eight original useful card concepts accounted for; visual review passes |
| 6. Publication and cache | Add named publication manifest, public projection and bounded cache; no-store private routes | Anonymous requests cannot access private data, including after cache warming |
| 7. Remove legacy | Delete Next app/components/Studio, old server transport/cache/cron, frontend dependencies/config, obsolete docs and assets | No old route/framework imports or dead dependencies; one runtime remains |
| 8. Public repository polish | Rewrite README, examples/env, formatting, CI; regenerate lock and restore frozen installs | Build/tests/lint/typecheck/audit pass; secret scan reviewed |
| 9. Preview verification | Check both owners with deliberately selected public/private test repos; malformed inputs, rate limits and concurrent calls | Vercel preview passes; permissions and actual Camo compatibility checked |
| 10. Cutover | Update Vercel framework/env settings, deploy approved release, update README URLs, withdraw old private endpoint/cache copies where possible | Production smoke checks; old endpoints absent; operator access works |

Do not accumulate permanent compatibility aliases: legacy `/api/cards/*` URLs are
an intentional breaking change. Update operator-owned embeds during cutover. Keep
the old revision in Git for reference, not as a deployable parallel app. A rollback
must not restore the old public private-activity endpoint with private credentials;
disable those credentials first or roll back only to a privacy-safe revision.

No database or Redis migration is needed. Remove obsolete Vercel secrets/cron and
retire Upstash only after successful cutover and explicit infrastructure cleanup
authorization. Source edits do not purge already published images.

## Audit limits and verification record

This is a static architecture/security review, not a penetration test or deployed
permissions test. Repository credential values were not read, and no authenticated
GitHub data was fetched. Existing test files were reviewed for coverage; application
tests/build were not run because dependencies are not installed in this checkout.
Current GitHub/Vercel documentation was consulted for authentication and deployment
decisions. `pnpm audit --audit-level=high --json` failed with `fetch failed` both
inside the sandbox and on the network-enabled retry. Current dependency advisory
status is therefore unverified; no clean vulnerability result is claimed.
Markdown fences and trailing whitespace were checked. Only this root architecture document is changed by this
task; the legacy `docs/ARCHITECTURE.md` still describes the existing implementation.
