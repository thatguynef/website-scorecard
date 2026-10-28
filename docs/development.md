# Development

## Requirements

- **Node.js** 22 or newer (the collector uses the built-in WebSocket client)
- **Python** 3.10 or newer
- **Google Chrome** or Chromium (the collector drives it through the DevTools Protocol)
- **Lighthouse** (optional but recommended; the collector tries `npx --no-install lighthouse`, then `npx lighthouse`)
- No npm dependencies are required for the core pipeline

Check your environment:

```sh
npm run doctor
```

## Install

```sh
git clone https://github.com/thatguynef/website-scorecard.git
cd website-scorecard
npm run doctor
npm test
```

There is no build step. The repository is plain `.mjs` and `.py` scripts.

For a step-by-step first run from a website URL, see [Run an audit](run-an-audit.md).

## Common commands

```sh
npm test                 # Python scorer tests + Node pipeline/verifier tests
npm run check            # tests + rubric + generated docs + schemas + links + assets + privacy
npm run check:generated  # rubric.md, coverage-matrix.json, portable-checklist.md
npm run check:rubric     # rubric structure and weights
npm run check:schemas    # JSON Schema files parse
npm run check:links      # relative Markdown and HTML image links resolve
npm run check:assets     # image existence, alt text, and size budgets
npm run check:eval       # mock eval harness (no model calls)
npm run check:privacy    # tracked-file secret/PII scan
npm run render:assets    # regenerate the sample and social previews
npm run docs:build       # mkdocs build --strict (venv active)
npm run docs:serve       # mkdocs serve (venv active)
npm run audit -- --help  # single collector entrypoint
npm run eval -- --help   # cross-model eval harness
```

The underlying stages remain directly runnable:

```sh
node .opencode/skills/home-service-website-audit/scripts/collect.mjs --help
python3 .opencode/skills/home-service-website-audit/scripts/score.py --help
node .opencode/skills/home-service-website-audit/scripts/render.mjs --help
node .opencode/skills/home-service-website-audit/scripts/verify.mjs --help
```

## Repository layout

```text
.opencode/skills/home-service-website-audit/
  SKILL.md
  references/
    rubric.json                 canonical V2 rubric
    rubric.md                   generated
    coverage-matrix.json        generated
    v2-one-page-template.md
    v2-report-template.md
    fix-library.md
    model-matrix.md
    legacy/                     preserved V1 rubric and template
  scripts/
    collect.mjs
    score.py
    render.mjs
    verify.mjs
    eval.mjs
    test_score.py
    test_pipeline.mjs
    fixtures/
    legacy/verify-v1.mjs
docs/
examples/
scripts/                        entrypoint, doctor, privacy scan
```

## Add a check

1. Add the item to `references/rubric.json` with:
   - unique ID (`RL-XXX-00`)
   - category, weight, allowed scores, anchors
   - `journeyStage`, `revenueLeak`, `evidenceType`
   - `evaluation` (`deterministic` or `model_judgment`)
   - `applicability` (`required`, `recommended`, or `conditional`)
   - `severity`, `serviceMapping`, `viewports`, `evidence`
2. Add it to a journey stage's `checks` array, or to `supportingSystems`.
3. If conditional, add it to `optionalModules` and document the configuration key.
4. Regenerate:
   ```sh
   python3 .opencode/skills/home-service-website-audit/scripts/render_rubric.py
   python3 .opencode/skills/home-service-website-audit/scripts/render_coverage.py
   python3 .opencode/skills/home-service-website-audit/scripts/render_portable.py
   ```
5. Add the auto score (if deterministic) in `collect.mjs` and the judgment instruction to `SKILL.md`.
6. Add a test to `test_score.py` and, if it changes a cap or invariant, a mutation to `verify.mjs`.
7. Update `docs/scoring.md`, `docs/evidence.md`, and `docs/v1-to-v2-migration.md` if the check's meaning changed.
8. Run `npm run check`.

Do not add a check just to increase the count. Every check should answer at least one of:

- Can this cost the business a lead?
- Can this prevent a booking?
- Can this weaken trust?
- Can this waste traffic?
- Can this hide a revenue opportunity?
- Can this prevent measurement?

## Change scoring weights

1. Edit `categories[].max` and item maxima so each category's items sum to its weight.
2. Regenerate the rubric and coverage matrix.
3. Re-lock the V2 golden fixture expectation or add a new fixture. Do not silently change an existing expected score.
4. Update the worked example in `docs/scoring.md`.
5. Run `npm run check`.

## Fixtures

| Fixture | Purpose | Expected |
|---|---|---|
| `acme-plumbing-v2.audit.json` | V2 golden: good public site + owner-data unknowns | 68 / 100, band C |
| `legacy-roofing-a-v1.audit.json` | V1 golden, sanitized | 36 / 100, band F |
| `legacy-roofing-b-v1.audit.json` | V1 golden, sanitized | 41 / 100, band D |

Fixtures are synthetic or sanitized. Never add a real client's name, phone, address, customer review, or screenshot to this public repository.

## Golden rule for score changes

If a rubric or scorer change alters a golden score:

- add or update the fixture deliberately,
- document why the score changed,
- keep the legacy expectation under the legacy rubric,
- never rewrite a historical report's score in place.

## Tests

Python scorer tests:

```sh
python3 -m unittest discover -s .opencode/skills/home-service-website-audit/scripts -p 'test_*.py'
```

Node pipeline tests (verifier mutations, renderer, example):

```sh
node --test .opencode/skills/home-service-website-audit/scripts/test_pipeline.mjs
```

Full check:

```sh
npm run check
```

## Generated artifacts

`rubric.md`, `coverage-matrix.json`, and `docs/portable-checklist.md` are generated. Do not edit them by hand. CI fails if they are stale.

The canonical source is `references/rubric.json`.

## Documentation site

The docs are plain Markdown and build with MkDocs Material.

```sh
python3 -m venv .venv-docs
.venv-docs/bin/pip install -r requirements-docs.txt
.venv-docs/bin/mkdocs serve
.venv-docs/bin/mkdocs build --strict
```

`mkdocs.yml` uses `docs_dir: docs` and excludes `docs/README.md` so the GitHub folder index does not conflict with the site home at `docs/index.md`. Source pages keep GitHub-style alerts (`> [!NOTE]`); `scripts/mkdocs_github_alerts.py` converts them to Material admonitions at build time.

Regenerate the preview images from the synthetic example only:

```sh
npm run render:assets
npm run check:assets
```

`check_assets.mjs` enforces image existence, alt text, per-file budgets, a 2 MB total, and blocks references to `.audit/`, `audit-screens/`, `reports/`, or `evals/`.

The site deploys from `.github/workflows/docs.yml`. Enable GitHub Pages with source **GitHub Actions** before the first deploy. Do not hand-edit `docs/assets/scorecard-preview.png` or `docs/assets/social-preview.png`; regenerate them.

## Error handling

- Missing Chrome: set `CHROME_PATH` or install Chrome.
- Lighthouse unavailable: `--skip-lighthouse` leaves `RL-MOB-01` unscored. A delivered real run still needs three Lighthouse runs or a documented waiver; `--synthetic` is only for the public examples.
- Site blocks headless: use an interactive browser, capture screenshots manually, and score from the evidence.
- Invalid URL: the collector exits 2 with a usage message.
- Missing required argument: every public CLI prints `--help`.
- Malformed audit JSON: the scorer exits 2 with the JSON error.
- Stale rubric version: the scorer fails strict mode with the expected/actual version.

## CI

`.github/workflows/ci.yml` runs on push and pull request:

- Python scorer tests
- Node pipeline tests
- rubric validation
- generated-doc freshness
- JSON Schema syntax
- relative-link checks
- image/asset checks
- mock eval harness (no model calls)
- privacy scan
- the synthetic V2 example verification
- the docs site build (`.github/workflows/docs.yml`, strict mode)

CI does not audit production websites, submit forms, call businesses, send messages, or make model calls. Cross-model evals are manual/scheduled because they cost money and are nondeterministic.

## Privacy

Read `docs/privacy.md` before adding any fixture, screenshot, or example. The repository is public. Raw audit evidence stays local.

## Backwards compatibility

- Patch version: wording or evidence changes that do not change scores.
- Minor version: point/weight changes.
- Major version: added/removed checks, schema changes, or a changed total.
- Historical reports keep their rubric version.
- The scorer supports V1 and V2 side by side.
