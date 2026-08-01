# Security guide

Public card queries use strict schemas, size/count limits, duplicate-key rejection, GitHub identifier allowlists, bounded arrays, enumerated themes/layouts/locales, and normalized cache keys. Text is escaped at the SVG boundary. Remote images are restricted to GitHub avatar hosts. SVG documents contain no scripts, event handlers, foreign objects, external stylesheets, or remote fonts.

Internal refresh and metrics routes require `Authorization: Bearer $CRON_SECRET` and return `private, no-store`. Never expose that secret to client code. GitHub and Redis tokens are server-only.

## Secret response

Revoke a token immediately if it appears in source, logs, screenshots, build artifacts, or Git history. Replace it in every Vercel environment, redeploy, and purge it from history when the repository has been shared.

## Reporting

Report vulnerabilities privately to the repository owner. Include reproduction steps and affected routes; do not include real credentials or private GitHub data.
