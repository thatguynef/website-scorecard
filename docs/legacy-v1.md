# Legacy V1 — 42-Check Hormozi Rubric

V1 is preserved for historical reproducibility. It is **not** the current scoring model.

- Canonical V1 rubric: `.opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.json`
- Generated V1 rubric: `.opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.md`
- V1 verifier: `.opencode/skills/home-service-website-audit/scripts/legacy/verify-v1.mjs`
- V1 example: `examples/legacy-v1-roofing/`

## V1 categories

| Category | Max |
|---|---|
| A. Offer and positioning | 20 |
| B. Conversion path | 20 |
| C. Proof and trust | 15 |
| D. Pricing and offer architecture | 15 |
| E. Mobile experience and speed | 15 |
| F. Local SEO | 10 |
| G. Content and objections | 5 |
| **Total** | **100** |

V1 includes Spanish access as a fixed 4-point item (3 mobile, 1 desktop), and scores financing, VSL, tiers, membership, paid priority, and content freshness universally. Those choices are why V2 exists.

## V1 caps

| Cap | Max |
|---|---|
| `no_contact` | 30 |
| `broken_cta` | 50 |
| `mobile_unusable` | 60 |
| `no_mobile_offer` | 75 |
| `no_https` | 40 |

## V1 golden scores

| Fixture | Final | Band | Cap |
|---|---|---|---|
| `legacy-roofing-a-v1.audit.json` | 36 | F | 50 |
| `legacy-roofing-b-v1.audit.json` | 41 | D | 60 |

The fixtures are sanitized. Company names, phones, addresses, customer names, and license numbers are placeholders.

## Run V1

```sh
python3 .opencode/skills/home-service-website-audit/scripts/score.py \
  --input examples/legacy-v1-roofing/audit.filled.json \
  --rubric .opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.json \
  --out examples/legacy-v1-roofing/scores.json \
  --markdown examples/legacy-v1-roofing/scorecard.md --strict
```

## Historical rule

A delivered V1 report keeps its V1 rubric version. Do not retroactively rescore it under V2. If the client needs a current diagnosis, run a new V2 audit with a new run ID and explain that the score is not directly comparable.

See [`v1-to-v2-migration.md`](v1-to-v2-migration.md) for the full check-by-check mapping.
