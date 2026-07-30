# RepoPulse

Beautiful GitHub metrics. Built to stay online.

RepoPulse is a production-minded Next.js foundation for customizable and reliable GitHub statistics cards. This phase contains the full product shell, navigation, responsive UI, design system, playground mock, documentation, pricing, dashboard preview, and health endpoint. No real GitHub or persistence logic is included yet.

## Local development

Requirements: Node.js 20.9+ and pnpm.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Validate changes with:

```bash
pnpm lint
pnpm build
pnpm format:check
```

## Environment

`NEXT_PUBLIC_APP_URL` has a safe production default in `.env.example`. Database, GitHub, and Redis variables are optional during this phase and validated through Zod in `src/config/env.ts`.

## Architecture

- `src/app`: App Router routes and layouts, grouped into marketing and dashboard surfaces.
- `src/components`: UI primitives, shared layout, marketing, playground, and dashboard components.
- `src/config`: product metadata and typed environment validation.
- `src/lib`: framework-agnostic shared utilities.
- `src/server`: boundaries for future database, repository, service, and validation code.
- `src/types`: shared domain types.

React Server Components are the default. Client components are limited to interactions such as switches, copying, and playground preview state.

## Deploy to Vercel

1. Push this repository to your Git provider.
2. Import it into Vercel with the Next.js preset.
3. Set the production domain to `repopulse.kubik.gr`.
4. Add `NEXT_PUBLIC_APP_URL=https://repopulse.kubik.gr`.
5. Add database, GitHub, and Redis secrets only when those integrations are implemented.
6. Deploy. Vercel detects `pnpm-lock.yaml` and uses pnpm automatically.

## Intentionally deferred

- GitHub API calls and OAuth
- Database entities and Prisma migrations
- Real SVG card rendering
- Redis caching and rate limiting
- Payments, plans, and subscription logic
- Authentication enforcement
- Real API usage tracking
