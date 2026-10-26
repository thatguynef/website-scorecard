# Acme Plumbing — synthetic V2 example

This is a **synthetic** example for the Website Revenue Leak Scorecard V2. No real business, customer, phone number, address, or evidence is represented.

- Score: **68 / 100**
- Band: **C — Average**
- Rubric: **2.0.0**
- Run: `2026-10-26T1000`
- Configuration: English-only, SMS off, chat/callback off, after-hours on, licensing on

## Why the score is 68

| Category | Earned | Applicable | Weight | Normalized |
|---|---|---|---|---|
| Understand | 13 | 18 | 20 | 14.44 |
| Contact | 17 | 20 | 22 | 18.70 |
| Respond and Book | 11 | 16 | 16 | 11.00 |
| Trust | 9 | 15 | 15 | 9.00 |
| Mobile and Technical | 8 | 15 | 15 | 8.00 |
| Findability | 5 | 8 | 8 | 5.00 |
| Measurement | 2 | 4 | 4 | 2.00 |
| **Total** | | | **100** | **68.10** |

The language, SMS, and chat checks are N/A because the configuration disables those modules. They are removed from the denominator, not scored as zero.

## What the example demonstrates

1. **Verified leak:** the mobile estimate form is harder than it needs to be. This is directly observable and scored.
2. **Strong signal:** the form has no visible acknowledgement or response-time promise. The site cannot prove actual response time, so the finding is labeled strong signal.
3. **Owner data required:** unclosed estimate follow-up is presented as an investigation opportunity. It does not reduce the website score.

## Files

- `audit.filled.json` — synthetic audit input
- `scores.json` — deterministic scorer output
- `scorecard.md` — internal scorecard
- `one-page.md` — contractor-facing report
- `full-report.md` — supporting detail with all 40 checks
- `run.json`, `site-map.json`, `paths.json` — run manifest and non-destructive path traces
- `content.json` — prose used by the renderer

## Rebuild

```sh
python3 .opencode/skills/home-service-website-audit/scripts/score.py \
  --input examples/acme-plumbing/audit.filled.json \
  --out examples/acme-plumbing/scores.json \
  --markdown examples/acme-plumbing/scorecard.md --strict

node .opencode/skills/home-service-website-audit/scripts/render.mjs \
  --scores examples/acme-plumbing/scores.json \
  --content examples/acme-plumbing/content.json \
  --out examples/acme-plumbing/one-page.md

node .opencode/skills/home-service-website-audit/scripts/render.mjs --mode full \
  --scores examples/acme-plumbing/scores.json \
  --content examples/acme-plumbing/content.json \
  --out examples/acme-plumbing/full-report.md
```
