# Security

## Historical credential exposure

The 2026-09-13 review found a GitHub PAT-shaped value assigned to `GITHUB_TOKEN`
in `.env.example` in historical commits `1c3a0c7`, `9eb0bfc`, `93c313c`, and
`47fd2c9`. It was not printed, tested, or reused. Treat that credential as exposed
and revoke it at GitHub if it has not already been revoked. Update any deployments
that used it with new, narrowly scoped credentials. Revocation status is unverified.

The current files contain no match for the common GitHub-token/private-key patterns
checked. Old commits still contain the value: removing it from the current tree
does not remove it from history. History rewriting and remote cleanup need a
separate coordinated operation; this rewrite has not altered Git history.

## Operating safely

RepoPulse is a personal API. Public source code does not make its activity data
public. Keep `REPOPULSE_PUBLISH_ACTIVITY=false` unless every configured card field
is approved for public disclosure. HTTPS is required outside localhost.

- Use a separate random operator key; never put it in a URL or README.
- Limit each GitHub fine-grained PAT to selected repositories and Contents read.
  Set an expiry, obtain organization approval, and rotate regularly. Contents read
  grants source access even though RepoPulse requests no source content.
- Keep credentials and sensitive repository names in ignored local environment
  files or Vercel settings. Never provide production secrets to untrusted previews,
  fork PR workflows, test fixtures, logs, or examples.
- No arbitrary remote URLs, user-supplied GraphQL, SVG templates, or filesystem
  paths are accepted. All query parameters are rejected. The fixed GitHub origin
  rejects redirects. Response bodies and work are bounded.
- The single in-memory cache and error backoff reduce upstream requests; they are
  not distributed abuse prevention. Use Vercel traffic protections if public SVG
  traffic warrants them. No application-level global rate guarantee is claimed.
- To stop publishing, disable the publication flag and redeploy, then invalidate
  applicable CDN caches. GitHub/browser copies may remain. To revoke operator access,
  rotate the API key and redeploy. Revoke compromised PATs at GitHub immediately.
- Do not roll back to the legacy public private-activity endpoint with its old
  private token configured.

Report vulnerabilities using GitHub's private vulnerability reporting when enabled,
or contact the repository owner privately. Do not publish real credentials, private
repository details, or an exploit against a live deployment in a public issue.

Repository owners should enable GitHub secret scanning/push protection and private
vulnerability reporting. These hosting settings cannot be enabled by a source file.
Run a history-aware secret scan before first publication; a pattern scan of the
working tree does not prove that all earlier revisions are secret-free.

Two narrow dependency overrides pin patched transitive releases until upstream
constraints catch up: multer 2.3.0 (multipart DoS fixes) and brace-expansion 5.0.9
(resource-exhaustion fix). The application does not enable uploads or body parsers,
but the shipped dependency tree is patched anyway. Reassess these overrides when
updating Nest/ESLint; keep frozen installs and rerun the audit.
