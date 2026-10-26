# Examples

All examples in this directory are **synthetic or sanitized**. They are not real client case studies, and they do not describe a real business's revenue, customers, or internal operations.

| Date | Client | Market | Score | Band | Reports |
|---|---|---|---|---|---|
| 2026-10-26 | Acme Plumbing (synthetic) | Example County, CA | **68/100** | C — Average | [One-page](acme-plumbing/one-page.md) · [Full report](acme-plumbing/full-report.md) |
| 2026-10-24 | Example Roofing A (legacy V1) | Example County, CA | **36/100** | F — Critical | [One-page](legacy-v1-roofing/one-page.md) · [V1 scorecard](legacy-v1-roofing/scorecard.md) |

## What each example demonstrates

- **`acme-plumbing/`** — the V2 Revenue Leak Framework. It shows a good public website with a real observable leak, a strong-signal response issue, and an owner-data opportunity that does **not** reduce the website score.
- **`legacy-v1-roofing/`** — the legacy 42-check V1 rubric. It exists so historical scores remain reproducible. Do not compare the V1 total directly with a V2 total.

## Verifying the V2 example

```sh
node .opencode/skills/home-service-website-audit/scripts/verify.mjs \
  --run examples/acme-plumbing \
  --report examples/acme-plumbing/full-report.md \
  --one-page examples/acme-plumbing/one-page.md \
  --index examples/README.md \
  --mutation --fixture --synthetic
```

The `--synthetic` flag skips screenshot and Lighthouse file checks. A real run does not use it.
