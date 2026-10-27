---
name: Home Service Website Audit
description: Diagnose where a local home-service website may be leaking customers and revenue using the evidence-based Website Revenue Leak Scorecard. Collect mobile and desktop evidence, score the site, separate verified findings from owner-data opportunities, and produce a contractor-facing report plus a machine-readable result.
---

# Website Revenue Leak Scorecard

Use this skill when the user asks to audit, score, review, benchmark, or teardown a local home-service website (plumbing, HVAC, roofing, electrical, pest, garage door, landscaping, cleaning, restoration, moving) and wants to know **where the business may be losing customers or revenue**, not just how technically healthy the site is.

The website is the observable front end of the customer journey:

```text
VISITOR → UNDERSTANDING → LEAD → RESPONSE → QUALIFICATION → BOOKING
        → ESTIMATE → FOLLOW-UP → CUSTOMER → REVIEW → REFERRAL → REACTIVATION
```

The score is evidence-based. It separates:

- **Website score** — what the audit can observe.
- **Revenue opportunities to investigate** — what requires owner or CRM data.
- **Verified / Strong Signal / Owner Data Required / Not Applicable** — the evidence state of every finding.

The website audit must never pretend it can see the CRM, phone system, booking capacity, estimate follow-up, or closed revenue.

## Inputs

| Input | Required | Example |
|---|---|---|
| URL | Yes | `https://example.com` |
| Client name | Yes | `Example Plumbing` |
| Trade | Yes | `plumbing` |
| City / market | Yes | `San Diego, CA` |
| Primary service term | Yes | `plumbing` |
| Preferred languages | No | `en,es`; enables the language-access module |
| Optional modules | No | SMS, chat/callback, after-hours, licensing, paid traffic |
| Competitors | No | Used only for differentiation |
| Date | No | Defaults to today |

If the business has no website, say so. Do not invent a website score; deliver a short site plan instead.

## Pipeline

Run from the repository root. The single entrypoint is:

```sh
npm run audit -- \
  --url "https://example.com" \
  --client "Example Co." \
  --trade plumbing \
  --city "San Diego" \
  --service plumbing \
  --max-pages 12
```

It runs the collector and prints the exact scoring, rendering, and verification commands. The stages remain independently runnable:

### 1. Collect

```sh
node .opencode/skills/home-service-website-audit/scripts/collect.mjs \
  --url "https://example.com" \
  --slug example \
  --client "Example Co." \
  --city "San Diego" \
  --service plumbing \
  --max-pages 12 \
  --lh-runs 3
```

This writes `.audit/<slug>/<run-id>/` with:

- `audit.json` — signals and a V2 check skeleton; judgment checks are `null`
- `evidence/` — mobile/desktop screenshots
- `lighthouse-mobile-1..3.json` — median LCP drives `RL-MOB-01`
- `site-map.json` — pages and conversion paths
- `paths.json` — call, text, form, book, estimate, chat, financing, reviews traces
- `run.json` — run ID, rubric/collector versions, configuration, pages, viewports

Raw evidence stays in `.audit/<slug>/<run-id>/`. The `npm run audit` entrypoint also creates the report package at `reports/<domain>/<run-id>/`; if you run `collect.mjs` directly, create that directory yourself.

The collector is non-destructive. It never submits a form, places a call, sends a text, books an appointment, creates an account, or enters payment details. It may click a Book Now control once to detect a scheduler iframe; no appointment is selected.

### 2. Review and fill judgment

Read the mobile screenshots first, then desktop. Fill every applicable `null` check in `audit.json`, set `needs_review` to `false`, and save it as `reports/<domain>/<run-id>/audit.filled.json`.

Rules:

- Screenshot or source citation, or it did not happen.
- Absent is a finding, not an assumption.
- Weaker viewport wins on mobile+desktop checks.
- Do not mark a required check N/A. N/A is for configured optional modules only.
- Use `VERIFIED` for directly observed problems and `STRONG_SIGNAL` when the evidence strongly suggests a problem but the business outcome cannot be proven.
- Owner-data questions go in the report, not into the score.
- Do not claim "responds slowly," "loses estimates," or "wastes ad spend" without evidence.

### 3. Score

```sh
python3 .opencode/skills/home-service-website-audit/scripts/score.py \
  --input reports/example.com/<run-id>/audit.filled.json \
  --out reports/example.com/<run-id>/scores.json \
  --markdown reports/example.com/<run-id>/scorecard.md \
  --strict
```

`--strict` fails on missing checks, invalid scores, invalid applicability, missing evidence, or missing confidence. The scorer is the executable validator; do not hand-edit `scores.json`.

### 4. Render the reports

Create `content.json` in the report package. The model writes the prose; the renderer owns the tables.

```sh
node .opencode/skills/home-service-website-audit/scripts/render.mjs \
  --scores reports/example.com/<run-id>/scores.json \
  --content reports/example.com/<run-id>/content.json \
  --out "reports/example.com/<run-id>/one-page.md"

node .opencode/skills/home-service-website-audit/scripts/render.mjs --mode full \
  --scores reports/example.com/<run-id>/scores.json \
  --content reports/example.com/<run-id>/content.json \
  --out "reports/example.com/<run-id>/full-report.md"
```

The one-pager leads with the three biggest revenue leaks, then the customer journey, score breakdown, strengths, fixes, owner-data opportunities, and next steps. The full report includes all checks and limitations.

The report package keeps `one-page.md`, `full-report.md`, `scores.json`, `scorecard.md`, `content.json`, `audit.filled.json`, `verification.json`, and a `README.md` together under `reports/<domain>/<run-id>/`.

After verification, write the package `README.md` with the client, URL, audit date, run ID, score, links to the one-page and full report, and the raw-evidence path.

Index the report locally (the index is gitignored):

```sh
node .opencode/skills/home-service-website-audit/scripts/index.mjs \
  --reports reports/index.local.md \
  --client "Example Co." --market "San Diego County, CA" \
  --score 68 --band "C — Average" --date 2026-10-26 \
  --one-page example.com/<run-id>/one-page.md \
  --full example.com/<run-id>/full-report.md
```

### 5. Verify

```sh
node .opencode/skills/home-service-website-audit/scripts/verify.mjs \
  --run .audit/example/<run-id> \
  --filled reports/example.com/<run-id>/audit.filled.json \
  --scores reports/example.com/<run-id>/scores.json \
  --report reports/example.com/<run-id>/full-report.md \
  --one-page reports/example.com/<run-id>/one-page.md \
  --index reports/index.local.md \
  --out reports/example.com/<run-id>/verification.json \
  --mutation --fixture
```

The verifier writes `verification.json` into the report package and exits non-zero on any hard failure. **A run is not delivered unless it exits 0.**

Use `--synthetic` only for the sanitized examples in `examples/`; it waives screenshot and Lighthouse file checks.

### 6. Cross-model eval (periodic, optional)

```sh
node .opencode/skills/home-service-website-audit/scripts/eval.mjs \
  --snapshot .audit/example/<run-id> \
  --models "opencode/deepseek-v4.1-flash-free,opencode/mimo-v2.6-flash-free,opencode/qwen3.8-flash" \
  --judge opencode/gpt-6-luna \
  --out evals/$(date +%F)
```

The eval is blind: evidence is inlined, no tools or browsing. It samples judgment-heavy V2 checks, including CTA clarity, form friction, trust quality, customer-journey depth, language applicability, and confidence state (verified vs strong signal). A spread greater than 1 means the anchor is ambiguous; tighten the rubric text and rerun. Use `--mock` for a no-model dry run.

## Scoring model

| Category | Weight | Question |
|---|---|---|
| A. Understand | 20 | Can a visitor understand what is offered, where, for whom, and what to do next? |
| B. Contact | 22 | Can a ready visitor become a lead without friction or a dead end? |
| C. Respond and Book | 16 | Does the visible experience support a fast, qualified continuation? |
| D. Trust | 15 | Is there enough credible proof to act? |
| E. Mobile and Technical | 15 | Can the customer actually use the experience on a phone? |
| F. Findability | 8 | Can a qualified local prospect discover useful pages? |
| G. Measurement | 4 | Can lead-generation activity be measured? |

Bands: 90–100 A · 75–89 B · 60–74 C · 40–59 D · 0–39 F.

Applicability:

- **Required** — always scored; cannot be N/A.
- **Recommended** — scored by default; exclude only through configuration with a reason.
- **Conditional** — scored only when the module is enabled (language, SMS, chat/callback, after-hours, licensing).
- N/A checks are removed from the category denominator. Category weights are normalized so the result remains out of 100 without inflating the site. Owner-data questions never affect the score.

Hard caps: `no_contact` 30 · `primary_contact_broken` 50 · `form_unusable` 55 · `booking_failure` 60 · `mobile_unusable` 55 · `https_failure` 40 · `malicious_redirect` 20 · `unclear_offer` 65.

Full math, applicability, and cap rules: `docs/scoring.md`. Machine-readable source: `references/rubric.json`.

## Evidence rules

1. Screenshot or source citation for every scored check.
2. No credit for metadata or footer mentions where the check requires above-fold.
3. Absent is a finding, not an assumption.
4. Weaker viewport wins on mobile+desktop checks.
5. One observation, one score; do not double-count.
6. Mark proposed copy as **Proposed**; quote the site verbatim otherwise.
7. Flag illegal or non-compliant claims; do not fix them.
8. Do not confuse "not observed" with "the business does not do this."

Owner-data questions are not failures. They are the next conversation with the owner.

## Mobile-first rules

- Start at 390×844 with a mobile user agent.
- Open the menu, check the sticky action, inspect `tel:` and `sms:` hrefs.
- Check form labels, input types, autocomplete, field count, submit visibility, and clipped fields.
- Check the configured language access first on mobile, then desktop.
- Then desktop 1440×900.
- Lighthouse LCP is the median of at least three runs. A single run can be a cold-cache outlier.

## Do not

- Submit a form, place a call, send a text, book an appointment, or create an account.
- Enter payment details or test checkout.
- Audit behind a login or paywall.
- Let an auto score override a screenshot.
- Change the rubric mid-run; version it if the checks change.
- Put a client's raw evidence, credentials, or private data in this public repository.

## Failure modes

| Symptom | Fix |
|---|---|
| `Chrome not found` | Set `CHROME_PATH` to a Chrome/Chromium binary, or install Chrome |
| Chrome does not start | Retry with a fresh `--user-data-dir`; check for a stuck headless process |
| Lighthouse fails | Run `npm run doctor`; install Lighthouse. `--skip-lighthouse` leaves `RL-MOB-01` unscored, and a delivered real run still needs three runs or a documented waiver |
| Site blocks headless | Use an interactive browser, capture manually, and score from the screenshots |
| SPA never settles | Increase `--wait` to 10000; capture after the hero renders |
| Required check is null | Fill it with evidence; do not mark it N/A |
| Rubric version mismatch | Use the rubric version recorded in the run; do not silently rescore |
| Verifier fails | Fix the audit or report; never waive a hard invariant |

## Validation

```sh
npm test
npm run check
```

`npm run check` runs unit tests, the V1 and V2 golden fixtures, rubric validation, generated-artifact freshness, and the privacy scan. The V2 golden fixture `acme-plumbing-v2.audit.json` must score **68 / 100, band C**. The V1 fixture remains **36 / 100, band F** under the legacy rubric.

## Files

- `references/rubric.json` — canonical V2 rubric, journey, owner-data library, caps
- `references/rubric.md` — generated human-readable rubric
- `references/coverage-matrix.json` — generated machine-readable coverage matrix
- `references/v2-one-page-template.md` — contractor-facing report template
- `references/v2-report-template.md` — full audit template
- `references/fix-library.md` — problem → stage → why → fix → metric
- `references/model-matrix.md` — cross-model eval sets
- `references/legacy/rubric-v1.1.3.json` — preserved V1 rubric
- `scripts/collect.mjs` — screenshots, signals, Lighthouse median
- `scripts/score.py` — validation, applicability, normalization, caps
- `scripts/render.mjs` — one-page and full-report renderer
- `scripts/verify.mjs` — V2 output invariants, mutation tests, `verification.json`
- `scripts/legacy/verify-v1.mjs` — preserved V1 verifier for historical runs
- `scripts/eval.mjs` — blind cross-model judgment eval
- `scripts/test_score.py` — V1 and V2 scorer tests
