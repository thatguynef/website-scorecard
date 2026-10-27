# Run an Audit

> **For:** anyone auditing a local home-service website for the first time.

This guide takes you from a public website URL to a finished one-page report. The open-source toolkit runs on your machine; this repository does not host a web form.

If you want the short version, this is the command:

```sh
npm run audit -- \
  --url "https://example.com" \
  --client "Example Plumbing" \
  --trade plumbing \
  --city "San Diego, CA" \
  --service "plumbing" \
  --prepare
```

The rest of this page explains what each input means, what the command produces, and how to turn the collected evidence into the report you want.

## What you will get

| Output | File | Use it when |
|---|---|---|
| Contractor-facing one-pager | `one-page.md` | You want the three biggest leaks in one read |
| Full evidence audit | `full-report.md` | The owner or analyst asks where a finding came from |
| Score breakdown | `scorecard.md` | You want the category table without the prose |
| Machine-readable result | `scores.json` | Another tool consumes the score and findings |
| Delivery gate | `verification.json` | You need proof the run is internally consistent |

## Before you start

- **Node.js** 22 or newer
- **Python** 3.10 or newer
- **Google Chrome** or Chromium
- **Lighthouse** (optional for development; a delivered run needs three mobile runs or a documented waiver)

Check the environment before cloning anything else:

```sh
npm run doctor
```

## Step 1 — Install the toolkit

```sh
git clone https://github.com/thatguynef/website-scorecard.git
cd website-scorecard
npm run doctor
npm test
```

There is no build step. The repository is plain `.mjs` and `.py` scripts.

## Step 2 — Enter the website

The website goes in `--url`. Add the business details so the report is labeled correctly.

```sh
npm run audit -- \
  --url "https://example.com" \
  --client "Example Plumbing" \
  --trade plumbing \
  --city "San Diego, CA" \
  --service "plumbing" \
  --prepare
```

### What each input means

| Flag | What to enter | Example |
|---|---|---|
| `--url` | The public homepage, including `https://` | `https://example.com` |
| `--client` | The business name as the owner writes it | `Acme Plumbing` |
| `--trade` | The trade category | `plumbing` |
| `--city` | The city, county, or metro the business serves | `San Diego, CA` |
| `--service` | The primary service term; may be narrower than the trade | `water heater repair` |
| `--max-pages` | Pages to crawl (default `12`) | `12` |
| `--lh-runs` | Lighthouse runs (default `3`) | `3` |
| `--language` | Preferred languages, if multilingual access matters | `en,es` |
| `--config` | A market configuration file | `config/market.example.json` |
| `--prepare` | Copies `audit.json` to `audit.filled.json` for you | — |
| `--skip-lighthouse` | Skips Lighthouse; leaves `RL-MOB-01` unscored | — |
| `--slug` | Output folder name (default: hostname with dots replaced by dashes) | `example-plumbing` |
| `--run-id` | Run folder name (default: local `YYYY-MM-DDTHHMM`) | `2026-10-27T1400` |

Rules for the URL:

- Use the **public homepage**, not a login, staging, preview, or password-protected URL.
- Include `https://`. A bare domain fails validation.
- Audit only a site you have permission to review.
- One URL per run. Use a new run for a different site or a later re-audit.

If the business has no website, do not invent a score. Say so and deliver a short site plan instead.

## Step 3 — Let the collector run

The collector loads the public pages, captures mobile and desktop screenshots, reads DOM signals and Lighthouse, builds a site map, and records non-destructive path traces.

It writes two directories:

```text
.audit/<slug>/<run-id>/          raw evidence, audit.json, screenshots
reports/<domain>/<run-id>/       report package and audit.filled.json
```

It also prints the exact scoring, rendering, and verification commands, with the real paths filled in. Use those printed paths; do not guess the run ID.

The collector does **not** submit a form, place a call, send a text, book an appointment, create an account, or enter payment details. Every path trace records `submitted: false`.

## Step 4 — Fill the judgment checks

The deterministic checks are already scored. The checks that need a human or model judgment are left `null` in `audit.filled.json`.

Open:

```text
reports/<domain>/<run-id>/audit.filled.json
```

For every applicable check, provide:

| Field | What to put there |
|---|---|
| `score` | An allowed score for that check in the rubric |
| `evidence` | At least one concrete observation, tied to a screenshot or DOM signal |
| `confidence` | `verified` or `strong_signal` |
| `applicable` | `true` |

A filled check looks like this:

```json
"RL-UND-01": {
  "score": 2,
  "evidence": ["M-01: hero names the service and the city."],
  "confidence": "verified",
  "applicable": true
}
```

If a check genuinely does not apply, mark it N/A with a reason:

```json
"RL-UND-08": {
  "score": null,
  "evidence": [],
  "confidence": "not_applicable",
  "applicable": false,
  "na_reason": "multilingual access not configured for this market"
}
```

Do not guess. If the public site cannot prove something, it belongs in the owner-data questions, not in a check score. `score.py --strict` rejects missing scores, invalid values, and missing evidence.

Start with the highest-weight categories (Contact and Understand) and the three findings you would tell the owner first.

## Step 5 — Score the audit

```sh
python3 .opencode/skills/home-service-website-audit/scripts/score.py \
  --input reports/<domain>/<run-id>/audit.filled.json \
  --out reports/<domain>/<run-id>/scores.json \
  --markdown reports/<domain>/<run-id>/scorecard.md \
  --strict
```

This produces the 0–100 score, band, category breakdown, findings, verified findings, strong signals, and owner-data questions. `--strict` is the quality gate. Fix the reported problem rather than removing the flag.

## Step 6 — Write `content.json`

The score is mechanical. The report prose is not.

The safest starting point is the synthetic example, which already has every field the templates expect:

```sh
cp examples/acme-plumbing/content.json reports/<domain>/<run-id>/content.json
```

Then replace every value. At minimum, review:

- `client`, `url`, `trade`, `market`, `date`
- `verdict` — one sentence naming the biggest observable leak
- `leaks[]` — `title`, `stage`, `what`, `evidence`, `why`, `fix`, `confidence`
- `strengths[]`
- `fixes[]` — `fix`, `checks`, `points`, `effort`
- `fixNote`
- `journey[]` and `journeyOnePage[]`
- `ownerData[]`
- `nextSteps[]`
- `executiveSummary[]`
- `evidenceNote` and `footer`

Do not leave the synthetic labels in place. The renderer warns about unfilled placeholders, and the verifier rejects them.

## Step 7 — Render the report you want

One-page report:

```sh
node .opencode/skills/home-service-website-audit/scripts/render.mjs \
  --scores reports/<domain>/<run-id>/scores.json \
  --content reports/<domain>/<run-id>/content.json \
  --out "reports/<domain>/<run-id>/one-page.md"
```

Full evidence audit:

```sh
node .opencode/skills/home-service-website-audit/scripts/render.mjs --mode full \
  --scores reports/<domain>/<run-id>/scores.json \
  --content reports/<domain>/<run-id>/content.json \
  --out "reports/<domain>/<run-id>/full-report.md"
```

The renderer owns the tables. You own the prose in `content.json`. It never invents business facts.

## Step 8 — Verify before delivery

```sh
node .opencode/skills/home-service-website-audit/scripts/verify.mjs \
  --run .audit/<slug>/<run-id> \
  --filled reports/<domain>/<run-id>/audit.filled.json \
  --scores reports/<domain>/<run-id>/scores.json \
  --report reports/<domain>/<run-id>/full-report.md \
  --one-page reports/<domain>/<run-id>/one-page.md \
  --index reports/index.local.md \
  --out reports/<domain>/<run-id>/verification.json \
  --mutation --fixture
```

`verification.json` is the delivery gate. It checks invariants, cross-artifact consistency, and mutation tests. If it reports a hard failure, fix the run; do not deliver it.

`--synthetic` is only for the public examples. A real client run must not use it.

## Step 9 — Open the report

Write `reports/<domain>/<run-id>/README.md` with the client, URL, audit date, run ID, score, and links to the one-page and full report. It is the package index.

Start with the one-pager:

```text
reports/<domain>/<run-id>/one-page.md
```

Use the full audit when the owner asks where a finding came from:

```text
reports/<domain>/<run-id>/full-report.md
```

Optionally add the run to your local index with the command printed by `npm run audit`:

```sh
node .opencode/skills/home-service-website-audit/scripts/index.mjs \
  --reports reports/index.local.md \
  --client "Example Plumbing" --market "San Diego, CA" \
  --score <score> --band "<band>" --date 2026-10-27 \
  --one-page example.com/<run-id>/one-page.md \
  --full example.com/<run-id>/full-report.md
```

## Choose your output

| If you want... | Stop after | File |
|---|---|---|
| Just the score and category table | Step 5 | `scorecard.md` |
| A contractor-facing one-pager | Step 7 | `one-page.md` |
| A full evidence audit | Step 7 | `full-report.md` |
| Machine-readable findings | Step 5 | `scores.json` |
| Proof the artifacts agree | Step 8 | `verification.json` |

## What the output means

- **0–100** is the observable website score. Bands: 90–100 A, 75–89 B, 60–74 C, 40–59 D, 0–39 F.
- **VERIFIED** means directly observed or safely tested.
- **STRONG SIGNAL** means the evidence suggests a problem, but the business outcome cannot be proven.
- **OWNER DATA REQUIRED** means the public site cannot answer it. These questions never reduce the website score.
- **NOT APPLICABLE** means the check does not reasonably apply to this business or market.

Read [Scoring](scoring.md) and [Evidence](evidence.md) for the full rules.

## Troubleshooting

| Problem | What to do |
|---|---|
| `npm run doctor` fails | Install the missing Node, Python, Chrome, or Lighthouse and rerun it |
| Chrome not found | Set `CHROME_PATH` to the Chrome or Chromium executable |
| Lighthouse missing | Use `--skip-lighthouse`; `RL-MOB-01` stays unscored. A delivered run needs three runs or a documented waiver |
| The site blocks headless Chrome | Use an interactive browser, capture the screenshots manually, and score from that evidence |
| `invalid --url` | Include `https://` and use the public homepage |
| `score.py --strict` fails | A check is missing a score, has an invalid value, or lacks evidence. Read the error and fix the audit |
| The renderer warns about placeholders | `content.json` is missing a field or still contains a placeholder |
| `verify.mjs` reports a hard failure | Do not deliver. Read `verification.json`, fix the run, and rerun the verifier |
| The run ID is unclear | It is printed by `npm run audit` and is the folder name under `.audit/<slug>/` |

## Privacy

Client reports stay local. `reports/*`, `.audit/`, and `audit-screens/` are gitignored. Never commit a client's screenshots, report, customer PII, or credentials. Read [Privacy](privacy.md) before publishing anything from a run.

## Prefer a done-for-you review?

The open-source toolkit in this repository runs locally. If you want a person to review the website and follow-up, the maintainer's scorecard at [radicalredrocket.com/scorecard](https://radicalredrocket.com/scorecard) asks for your name, email, and website. It reviews public information; no account or site access is required. That is a separate service, not the open-source CLI.

---

**Next:** [Architecture](architecture.md) — how the collector, scorer, renderer, and verifier fit together.
