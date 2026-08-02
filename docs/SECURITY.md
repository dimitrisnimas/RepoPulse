# Security guide

Public card queries use strict schemas, size/count limits, duplicate-key rejection, GitHub identifier allowlists, bounded arrays, enumerated themes/layouts/locales, and normalized cache keys. Text is escaped at the SVG boundary. Remote images are restricted to GitHub avatar hosts. SVG documents contain no scripts, event handlers, foreign objects, external stylesheets, or remote fonts.

Internal refresh and metrics routes require `Authorization: Bearer $CRON_SECRET` and return `private, no-store`. Never expose that secret to client code. GitHub and Redis tokens are server-only.

## Secret response

Revoke a token immediately if it appears in source, logs, screenshots, build artifacts, or Git history. Replace it in every Vercel environment, redeploy, and purge it from history when the repository has been shared.

## Reporting

Report vulnerabilities privately to the repository owner. Include reproduction steps and affected routes; do not include real credentials or private GitHub data.

## Dependency overrides

`pnpm-workspace.yaml` pins patched transitive versions of `sharp` and `postcss` inherited from Next.js. Regenerate and commit `pnpm-lock.yaml` from a machine with a trusted npm registry TLS chain, verify `pnpm why sharp` reports `0.35.0`, verify Next's PostCSS reports at least `8.5.18`, then restore frozen-lockfile installs.

## CodeQL availability

The CodeQL workflow uses the Node 24-based `github/codeql-action@v4` and runs automatically for public repositories. GitHub does not accept CodeQL uploads from private repositories unless GitHub Code Security is enabled. If this private repository is upgraded and Code Security is enabled under **Settings → Advanced Security**, remove the visibility condition from `.github/workflows/codeql.yml`.
