# Example Roofing A — legacy V1 example

This is a **sanitized, synthetic** example of the legacy 42-check rubric (`1.1.3`). It exists to show that historical scores keep their original rubric version. It is **not** comparable point-for-point with a V2 score.

- Score: **36 / 100**
- Band: **F — Critical**
- Rubric: **1.1.3** (legacy 42-check Hormozi rubric)
- Cap: broken CTA (maximum 50), not binding

## Files

- `audit.filled.json` — sanitized V1 audit fixture
- `scores.json` — V1 scorer output
- `scorecard.md` — V1 internal scorecard
- `one-page.md` — V1 contractor-facing example
- `content.json` — V1 prose used by the renderer

## Rebuild

```sh
python3 .opencode/skills/home-service-website-audit/scripts/score.py \
  --input examples/legacy-v1-roofing/audit.filled.json \
  --rubric .opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.json \
  --out examples/legacy-v1-roofing/scores.json \
  --markdown examples/legacy-v1-roofing/scorecard.md --strict
```

The V1 rubric is preserved at `.opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.json`. Do not rescore a historical report under V2; create a new V2 run with a new run ID and explain the change.
