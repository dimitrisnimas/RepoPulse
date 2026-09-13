# Contributing

Use Node 22 and pnpm 10.32.1. Run `pnpm install --frozen-lockfile`, `pnpm check`, and
`pnpm audit --audit-level=high`. Commit lockfile changes deliberately. The repository
intentionally does not include tests. Checks must not require GitHub credentials.

Keep the scope to one activity card. Review authentication, owner selection,
upstream failures and rendering boundaries when changing them. Regenerate
`docs/example.svg` with `pnpm example` after visual changes and inspect it. Use only
synthetic repository data in examples. Never commit local environment files.
