# Architecture

The repository is a deterministic diagnostic toolkit, not a SaaS platform. It is intentionally file-based and simple to inspect.

## Pipeline

```text
collect.mjs
   ↓  screenshots, DOM signals, Lighthouse, site map, path traces
audit.json + audit.filled.json
   ↓  model judgment for non-deterministic checks
score.py
   ↓  validation, applicability, normalization, caps, bands
scores.json + scorecard.md
   ↓  model prose in content.json
render.mjs
   ↓  one-page and full report
verify.mjs
   ↓  invariants, cross-artifact consistency, mutation tests
verification.json
```

## Components

| Component | Path | Responsibility |
|---|---|---|
| Collector | `.opencode/skills/home-service-website-audit/scripts/collect.mjs` | Non-destructive browser collection: screenshots, DOM signals, Lighthouse median, page discovery, scheduler detection, site map, path traces. |
| Canonical rubric | `.opencode/skills/home-service-website-audit/references/rubric.json` | Checks, weights, journey, owner data, caps, bands, optional modules. |
| Generated rubric | `.opencode/skills/home-service-website-audit/references/rubric.md` | Human-readable projection of the canonical JSON. Never hand-edit. |
| Coverage matrix | `.opencode/skills/home-service-website-audit/references/coverage-matrix.json` | Machine-readable check → stage → evidence → applicability → service mapping. Generated. |
| Portable checklist | `docs/portable-checklist.md` | Generated plain-Markdown export for external browser agents. |
| Scorer | `score.py` | Validates the filled audit, computes applicability-aware category normalization, caps, bands, findings, owner-data output, and coverage. Supports V1 and V2. |
| Scorer tests | `test_score.py` | V1 golden fixtures, V2 golden fixture, normalization, N/A, caps, confidence, evidence, version migration. |
| Renderer | `render.mjs` | One-page and full-report rendering from `scores.json` + `content.json`. Owns tables; model owns prose. |
| Index helper | `index.mjs` | Idempotent row insertion for a local, gitignored reports index (`reports/index.local.md`). |
| Generated-doc renderers | `render_rubric.py`, `render_coverage.py`, `render_portable.py` | Render derived artifacts from the canonical rubric and fail when stale. |
| Rubric validator | `validate_rubric.py` | Structural validation of the canonical rubric. |
| Verifier | `verify.mjs` | V2 output invariants, cross-artifact consistency, mutation tests, fixture checks, `verification.json`. |
| Legacy verifier | `scripts/legacy/verify-v1.mjs` | Preserved V1 verifier for historical runs. |
| Eval harness | `eval.mjs` | Blind cross-model judgment eval with confidence-state comparison. |
| Single entrypoint | `scripts/audit.mjs` | `npm run audit -- ...`; wraps collection and prints the next commands. |
| Doctor | `scripts/doctor.mjs` | Checks Node, Python, Chrome, Lighthouse, and git. |
| Privacy scan | `scripts/privacy_scan.mjs` | Scans tracked files for secrets, forbidden evidence paths, and PII-like values. |

## Data model

### `audit.json` / `audit.filled.json`

```json
{
  "schema_version": "2.0",
  "framework": "revenue-leak",
  "meta": {
    "client": "Example Co.",
    "url": "https://example.com/",
    "date": "2026-10-26",
    "run_id": "2026-10-26T1000",
    "run_timestamp": "2026-10-26T10:00:00Z",
    "rubric_version": "2.0.0",
    "collector_version": "2.0.0",
    "configuration": {
      "preferredLanguages": ["en"],
      "optionalChecks": {"language_access": false, "sms": false, "chat_callback": false},
      "excludedChecks": []
    }
  },
  "checks": {
    "RL-UND-01": {
      "score": 2,
      "evidence": ["M-01: hero names the brand but not the service."],
      "confidence": "verified",
      "applicable": true
    },
    "RL-UND-08": {
      "score": null,
      "evidence": [],
      "confidence": "not_applicable",
      "applicable": false,
      "na_reason": "multilingual access not configured for this market"
    }
  },
  "caps": {"no_contact": false},
  "topLeaks": [],
  "ownerData": []
}
```

### `scores.json`

Contains:

- `schema_version`, `framework`, `rubric_version`, `scorer_version`
- `categories[]` with `earned`, `applicable_max`, `max`, `normalized`, `percent`
- `checks[]` with `applicable`, `score`, `confidence`, `evidence`, `stage`
- `findings[]` with `lost`, `severity`, `serviceMapping`
- `verifiedFindings[]`, `strongSignals[]`
- `recommendations[]` and `evidence[]` for downstream consumers
- `ownerDataRequired[]` (never scored)
- `journey[]` stage status
- `coverage[]` check → stage matrix
- `topLeaks[]`
- `normalization` (method, applicable weight, N/A checks)
- `cap`, `cap_active`, `cap_binding`, `caps`
- `total`, `final`, `display`, `band`, `band_label`
- `recoverable[]`

### `verification.json`

Records the run ID, rubric version, verifier result, hard/soft failures, sampled checks, mutation result, and waivers. It is the delivery gate.

## Immutable runs

A run lives at `.audit/<slug>/<run-id>/`. A delivered run is immutable. A re-run gets a new `<run-id>`; it never overwrites a delivered run. The verifier can compare against a previous run with `--previous`.

## Non-destructive inspection

The collector may:

- load public pages,
- take screenshots,
- inspect the DOM,
- click a Book Now control once to detect a scheduler iframe,
- read Lighthouse output.

It may not:

- submit a form,
- place a call,
- send a text,
- book an appointment,
- create an account,
- enter payment details,
- log in to a private area.

`paths.json` records `submitted: false` for every path trace. The verifier fails if a trace says otherwise.

## Rubric as the single source of truth

```text
references/rubric.json
   ├── references/rubric.md            (render_rubric.py)
   ├── references/coverage-matrix.json (render_coverage.py)
   └── docs/portable-checklist.md      (render_portable.py)
```

CI runs each generator in `--check` mode and fails if a generated file is stale.

## V1 compatibility

V1 is preserved, not emulated:

- `.opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.json`
- `.opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.md`
- `.opencode/skills/home-service-website-audit/scripts/legacy/verify-v1.mjs`
- V1 golden fixtures under `scripts/fixtures/`

`score.py` detects the schema and uses the V1 direct-sum path. Historical reports keep their version. A V2 re-audit gets a new run ID and an explicit migration note.

## Extension points

- Add a check: edit `rubric.json`, add it to a journey stage, regenerate artifacts, add anchors and a test.
- Add an optional module: add it to `optionalModules`, mark the check `conditional`, set `defaultApplicable`, add configuration docs.
- Add a fixture: add a filled audit and expected score to `test_score.py`.
- Add a verifier invariant: implement it in `verify.mjs` and add a mutation that should be rejected.
- Add an eval check: pass `--checks RL-...` to `eval.mjs`; keep it judgment-only.

## What this is not

It is not a microservice, database, hosted dashboard, or SaaS. Prefer structured files, deterministic scripts, and clear docs. If a future hosted service is built, it should consume the JSON schema rather than fork the scoring logic.
