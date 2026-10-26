# Local reports

Generated client reports and the client index are **local by default** and are ignored by git. Do not commit a real client report, screenshot, contact detail, or audit evidence to this public repository.

## Where local files go

- Full audits: your local `.audit/<slug>/<run-id>/` directory.
- One-pagers and full reports: `reports/` locally. `reports/*.md` is gitignored.
- Client index: `reports/index.local.md` (gitignored). The index helper creates it on first use.

```sh
node .opencode/skills/home-service-website-audit/scripts/index.mjs \
  --reports reports/index.local.md \
  --client "Example Co." \
  --market "Example County, CA" \
  --score 68 \
  --band "C — Average" \
  --date 2026-10-26 \
  --one-page example-one-page.md \
  --full example-full-report.md
```

The command is idempotent: the same date + client updates the row instead of duplicating it.

## Public examples

Use `examples/` for synthetic or sanitized reports. Public examples must contain:

- a synthetic or sanitized business name,
- no customer PII,
- no private contact details or credentials,
- no raw screenshots that reveal private data,
- a clear **synthetic** or **sanitized** label.

See [`docs/privacy.md`](../docs/privacy.md) for the full data-handling rules.
