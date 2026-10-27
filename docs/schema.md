# Structured Output Schema

> **For:** developers and analysts consuming the JSON output.

The pipeline emits two machine-readable documents:

- `audit.filled.json` — the evidence and judgments for one run.
- `scores.json` — the deterministic result.

Schemas:

- [`references/schema/audit-v2.schema.json`](https://github.com/thatguynef/website-scorecard/blob/main/.opencode/skills/home-service-website-audit/references/schema/audit-v2.schema.json)
- [`references/schema/scores-v2.schema.json`](https://github.com/thatguynef/website-scorecard/blob/main/.opencode/skills/home-service-website-audit/references/schema/scores-v2.schema.json)

The scorer is the executable validator; the JSON Schemas describe the contract for downstream tools. If the two disagree, fix the scorer and the schema together.

## Versioning

| Field | Meaning |
|---|---|
| `schema_version` | Shape of the audit/scores document (`2.0`) |
| `rubric_version` | Meaning of the checks and weights (`2.0.0`) |
| `collector_version` | Collector that produced the run |
| `scorer_version` | Scorer that produced `scores.json` |
| `run_id` | Immutable run identifier (`YYYY-MM-DDTHHMM`) |

A schema change that breaks consumers requires a major version. A weight change requires a minor rubric version. Wording-only changes can be a patch.

## `audit.filled.json`

```json
{
  "schema_version": "2.0",
  "framework": "revenue-leak",
  "meta": {
    "client": "Example Co.",
    "slug": "example",
    "url": "https://example.com/",
    "date": "2026-10-26",
    "city": "San Diego, CA",
    "service": "plumbing",
    "run_id": "2026-10-26T1000",
    "run_timestamp": "2026-10-26T10:00:00Z",
    "rubric_version": "2.0.0",
    "collector_version": "2.0.0",
    "configuration": {
      "preferredLanguages": ["en"],
      "optionalChecks": {
        "language_access": false,
        "sms": false,
        "chat_callback": false,
        "after_hours": true,
        "licensing": true
      },
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
  "caps": {
    "no_contact": false,
    "primary_contact_broken": false,
    "form_unusable": false,
    "booking_failure": false,
    "mobile_unusable": false,
    "https_failure": false,
    "malicious_redirect": false,
    "unclear_offer": false
  },
  "topLeaks": [
    {
      "title": "No observable immediate acknowledgement",
      "confidence": "strong_signal",
      "checkId": "RL-RSP-01",
      "stage": "response"
    }
  ],
  "ownerData": []
}
```

### `checks[]`

Every rubric item appears exactly once.

| Field | Type | Notes |
|---|---|---|
| `score` | integer or null | Must be in the item's `allowed` set when applicable; `null` when N/A |
| `evidence` | array of strings | Required when applicable; screenshot IDs, source citations, path traces |
| `confidence` | string | `verified` or `strong_signal` when applicable; `not_applicable` when N/A |
| `applicable` | boolean | Must agree with the configuration |
| `na_reason` | string | Required when N/A |
| `needs_review` | boolean | Must not be true in a delivered filled audit |

### `topLeaks[]`

Optional but recommended. Used by the report and verifier.

| Field | Type | Notes |
|---|---|---|
| `title` | string | Contractor-facing |
| `confidence` | string | `verified`, `strong_signal`, `owner_data_required`, `not_applicable` |
| `checkId` | string | Present for verified/strong-signal leaks |
| `ownerDataId` | string | Present for owner-data leaks |
| `stage` | string | Journey stage ID |

### `ownerData[]`

Optional notes from the owner. The full question library lives in the rubric. Owner-data notes never affect the score.

## `scores.json`

```json
{
  "schema_version": "2.0",
  "framework": "revenue-leak",
  "rubric_version": "2.0.0",
  "scorer_version": "2.0.0",
  "meta": {"client": "Example Co.", "date": "2026-10-26"},
  "categories": [
    {
      "id": "A",
      "name": "Understand",
      "earned": 13,
      "max": 20,
      "applicable_max": 18,
      "normalized": 14.44,
      "applicable": true,
      "percent": 72.2
    }
  ],
  "checks": [
    {
      "id": "RL-UND-01",
      "title": "Service clarity",
      "category": "A",
      "stage": "understanding",
      "max": 4,
      "score": 2,
      "applicable": true,
      "confidence": "verified",
      "evidence": ["M-01"],
      "evaluation": "model_judgment",
      "severity": "critical",
      "serviceMapping": "revenue_recovery"
    }
  ],
  "findings": [],
  "verifiedFindings": [],
  "strongSignals": [],
  "ownerDataRequired": [],
  "journey": [],
  "coverage": [],
  "topLeaks": [],
  "normalization": {"method": "applicability_aware_category_normalization", "applicable_weight": 100, "raw_total": 68.14, "na_checks": []},
  "total": 68.1,
  "final": 68.1,
  "display": 68,
  "total_max": 100,
  "percent": 68.1,
  "cap": 100,
  "cap_active": false,
  "cap_binding": false,
  "caps": [],
  "band": "C",
  "band_label": "Average",
  "recoverable": []
}
```

### Key fields

| Field | Meaning |
|---|---|
| `total` | Normalized score before caps, one decimal |
| `final` | Score after caps, one decimal |
| `display` | Integer shown in the report; bands use this |
| `categories[].earned` | Raw points earned in the category |
| `categories[].applicable_max` | Raw points available after N/A exclusions |
| `categories[].normalized` | Category weight × earned ÷ applicable max |
| `normalization.applicable_weight` | Sum of category weights with applicable checks |
| `normalization.na_checks` | IDs excluded because the module is not applicable |
| `ownerDataRequired` | Owner-data questions; never scored |
| `journey` | Stage status and observable score |
| `coverage` | Check → stage → revenue-leak category → evidence → evaluation → applicability → severity → recommended intervention → service mapping |
| `recoverable` | Applicable checks with lost points, sorted by lost points |
| `cap_binding` | True only when the cap actually reduced the score |

## Evidence format

Evidence is an array of strings. Each string should be one of:

- A screenshot ID plus a short observation: `M-01: the hero names the brand but not the service.`
- A source citation: `title: "Example Plumbing"; meta: "Plumbing in Example City"`.
- A DOM fact: `form fields: 9 visible; no labels`.
- A path trace: `book: scheduler empty; no appointment selected`.
- A Lighthouse fact: `mobile LCP median 3.1 s across 3 runs`.

Do not put vague claims in evidence. If a human cannot verify the statement from the cited artifact, it is not evidence.

## `content.json` (report prose)

The renderer owns tables and placeholders; the model writes prose in `content.json`.

| Field | Purpose |
|---|---|
| `client`, `url`, `trade`, `market`, `date` | Report identity |
| `verdict` | One sentence the owner will repeat |
| `leaks[]` | `title`, `stage`, `what`, `evidence`, `why`, `fix`, `confidence` |
| `strengths[]` | What is already working |
| `fixes[]` | `fix`, `checks[]`, `points`, `effort` |
| `fixNote` | Short note on the first fixes |
| `journey[]` | `stage`, `status`, `summary` for the full report |
| `journeyOnePage[]` | Optional shorter journey table for the one-pager |
| `ownerData[]` | Selected owner-data opportunities (`title`, `stage`, `why`, `questions`) |
| `findings[]` | `id`, `observed`, `fix` for the full report table |
| `executiveSummary[]` | Full-report bullets |
| `evidenceNote` | What evidence exists and what is synthetic/limited |
| `fullReportLink` | Relative link from the one-pager to the full report (default `full-report.md`) |
| `footer` | Attribution and method note |

## Downstream use

A downstream tool can consume `scores.json` to:

- render a report,
- load a live teardown,
- prioritize fixes,
- map findings to a service offering,
- compare runs by rubric version.

It must not treat owner-data questions as website failures. It must not compare a V1 score with a V2 score.

---

**Next:** [Development](development.md) — tests, checks, and extension points.
