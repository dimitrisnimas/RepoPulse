# Contributing

Use Node.js 22 and pnpm 10. Install with `pnpm install --frozen-lockfile`, create a focused branch, and run `pnpm check` before opening a pull request. Public API changes require compatibility tests and documentation. Security-sensitive renderers require malicious-input tests.

Keep server-only code under `src/server`, route handlers thin, cache keys canonical, renderers deterministic, and browser-only Studio state versioned. Do not commit `.env`, tokens, generated builds, logs, or benchmark output.
