# Configuration

Configuration tells the scorecard which optional modules apply to this business and market. It does not change the rubric's meaning; it changes the denominator.

## Example

`config/market.example.json`:

```json
{
  "preferredLanguages": ["en", "es"],
  "optionalChecks": {
    "language_access": true,
    "sms": true,
    "chat_callback": false,
    "after_hours": true,
    "licensing": true,
    "financing": false,
    "paid_traffic": false
  },
  "excludedChecks": []
}
```

Run the collector with it:

```sh
npm run audit -- \
  --url "https://example.com" \
  --client "Example Co." \
  --trade plumbing \
  --city "San Diego" \
  --service plumbing \
  --config config/market.example.json
```

Or use the shortcut:

```sh
npm run audit -- ... --language en,es
```

Client-specific configuration files are local and gitignored under `config/*.json`; only `config/market.example.json` is published. Do not commit a config that identifies a client.

The collector writes the resolved configuration to `audit.json` → `meta.configuration` so the score is reproducible.

## Fields

### `preferredLanguages`

A list of language codes. `["en"]` means the site is evaluated in English only; language access is N/A. `["en", "es"]` enables the language check and evaluates whether Spanish is reachable.

Supported examples: `en`, `es`, `zh`, `vi`, `fr`. The rubric text and evidence detection are generic; the collector's Spanish notice detection is the most mature, and other languages rely on `hreflang`, language paths, and visible switchers.

If `preferredLanguages` contains more than one language and `optionalChecks.language_access` is not explicitly set, language access is enabled. An explicit `false` wins.

### `optionalChecks`

A map of module → boolean. Used for conditional checks:

| Key | Check | Default |
|---|---|---|
| `language_access` | `RL-UND-08` | off unless multiple preferred languages |
| `sms` | `RL-CON-03` | off |
| `chat_callback` | `RL-CON-09` | off |
| `after_hours` | `RL-RSP-02` | on |
| `licensing` | `RL-TRU-04` | on |

Unscored opportunity modules can also be set here for report context: `financing`, `video`, `membership`, `tiered_packages`, `priority_service`, `pricing_transparency`, `content_freshness`, `lead_magnet`, `referral_program`, `paid_traffic`. They do not change the score.

### `excludedChecks`

A list of **recommended** check IDs to exclude with a documented reason. Required checks cannot be excluded; conditional checks should be controlled by `optionalChecks`.

Use this sparingly. Excluding a check because the site scored badly is score manipulation, not configuration. The verifier validates the IDs.

## Trade profiles

The framework does not hardcode a trade profile. Start from these defaults and override:

### Emergency trades (plumbing, HVAC, restoration, pest, garage door)

```json
{
  "preferredLanguages": ["en"],
  "optionalChecks": {
    "language_access": false,
    "sms": true,
    "chat_callback": false,
    "after_hours": true,
    "licensing": true
  },
  "excludedChecks": []
}
```

After-hours and licensing matter. SMS may matter if the business accepts texts. Chat is optional.

### High-ticket trades (roofing, remodeling, solar, foundation)

```json
{
  "preferredLanguages": ["en"],
  "optionalChecks": {
    "language_access": false,
    "sms": false,
    "chat_callback": false,
    "after_hours": false,
    "licensing": true,
    "financing": true
  },
  "excludedChecks": []
}
```

Financing is an **opportunity flag**, not a scored requirement. The report can investigate it without penalizing a cash-only business.

### Bilingual market (for example, San Diego)

```json
{
  "preferredLanguages": ["en", "es"],
  "optionalChecks": {
    "language_access": true,
    "sms": true,
    "chat_callback": false,
    "after_hours": true,
    "licensing": true
  },
  "excludedChecks": []
}
```

Language access is scored because the market configuration says it matters. A Spanish site that is unreachable on mobile should be described as an access gap, not a character judgment.

## What configuration must not do

- It must not exclude a required check.
- It must not turn an owner-data question into a score.
- It must not change the rubric version.
- It must not be used to hide a low score without a reason.
- It must not hardcode a language as universally required.

## CLI flags

Collector:

```text
--config <json>        Configuration file
--language <codes>     Comma-separated preferred languages
--max-pages <n>        Pages to crawl (10-14 for a full audit)
--lh-runs <n>          Lighthouse runs (median of at least 3 recommended)
--skip-lighthouse      Leave RL-MOB-01 for manual review
--out <dir>            Raw audit output directory
--report-dir <dir>     Report output directory, default: reports/<domain>/<run-id>
--help                 Full help
```

Scorer:

```text
--input <json>         Filled audit
--out <json>           scores.json
--markdown <md>        scorecard.md
--rubric <json>        Override rubric (V1 or V2)
--strict               Fail on any validation error
--help
```

Renderer:

```text
--scores <json>        scores.json
--content <json>       Prose content
--out <md>             Output report
--mode one-page|full   Report shape
--template <md>        Override template
--help
```

Verifier:

```text
--run <dir>            Run directory
--filled <json>        Filled audit (default <run>/audit.filled.json)
--scores <json>        scores.json (default <run>/scores.json)
--report <md>          Full report
--one-page <md>        One-pager
--index <md>           Reports index
--out <json>           verification.json
--mutation             Mutation suite
--fixture              Golden fixtures
--synthetic            Allow synthetic example without screenshots/Lighthouse
--help
```

## Report output

`npm run audit` writes raw evidence to `.audit/<slug>/<run-id>/` and creates the report package at `reports/<domain>/<run-id>/`. The domain is the canonical hostname without `www.`. Use `--report-dir` to override the report package location.

## Paid traffic

If the business is known to buy traffic, enable the `paid_traffic` opportunity module and use conditional wording in the report:

> "If paid traffic is being sent to this page, this issue may be wasting acquisition spend."

Do not invent ad spend, campaign names, or performance. Tags are observable; profitability is owner data.
