# Agent Instructions — Website Scorecard

Read this before changing the repository. It applies to every agent and harness. `.opencode/skills/` is one discovery path, not the only one.

## What this is

An open, evidence-based diagnostic for local home-service websites. The public site is the observable part. The CRM, phone system, booking capacity, estimate follow-up, and close rate are **owner data**, never website findings.

| Resource | Path |
|---|---|
| Canonical rubric | `.opencode/skills/home-service-website-audit/references/rubric.json` |
| Audit workflow skill | `.opencode/skills/home-service-website-audit/SKILL.md` |
| Step-by-step audit | `docs/run-an-audit.md` |
| Development guide | `docs/development.md` |
| Documentation style | `docs/style-guide.md` |
| Live docs | `https://thatguynef.github.io/website-scorecard/` |

## Start here

| If you are… | Read / run |
|---|---|
| Auditing a website | `SKILL.md`, then `docs/run-an-audit.md` |
| Adding or changing a check | `docs/development.md`, then `references/rubric.json` |
| Changing scoring math | `score.py`, `test_score.py`, `docs/scoring.md` |
| Changing a report | `render.mjs`, the V2 templates, `examples/acme-plumbing/` |
| Changing docs or copy | `docs/style-guide.md` |
| Preparing a delivery | `verify.mjs`; `verification.json` is the gate |
| Checking the repository | `npm run check` and `mkdocs build --strict` |

## Rules

1. **Evidence before claims.** Every finding is VERIFIED, STRONG SIGNAL, OWNER DATA REQUIRED, or NOT APPLICABLE. Never present “not observed” as “not happening.”
2. **Do not invent business facts.** The public site cannot see response time, follow-up, booking capacity, or close rate. Mark those as owner data.
3. **The rubric is the source of truth.** Edit `references/rubric.json`, then regenerate the derived files.
4. **Do not hand-edit generated files:** `references/rubric.md`, `references/coverage-matrix.json`, `docs/coverage-completeness.md`, `docs/portable-checklist.md`, and `references/legacy/rubric-v1.1.3.md`.
5. **Keep the deterministic layers deterministic.** Collection and judgment are the only nondeterministic layers. Scoring, rendering, and verification must stay file-based and reproducible.
6. **No model calls or live audits in CI.** CI runs tests, rubric validation, generated-doc freshness, schema checks, link/asset checks, privacy, mock eval logic, and the synthetic example. Real audits and cross-model evals are manual.
7. **Public repository, private client work.** Never commit `.audit/`, `reports/`, `audit-screens/`, client screenshots, customer PII, credentials, or real client reports. Use synthetic or sanitized examples only.
8. **Non-destructive inspection.** Never submit a form, place a call, send a text, book an appointment, create an account, or enter payment details during an audit.
9. **Preserve V1.** Do not delete or rewrite the legacy rubric, fixtures, scorer path, or verifier. Historical reports keep their rubric version.
10. **Docs follow the style guide.** Plain language, one canonical source per concept, an audience note, alt text, asset budgets, and a `Next:` footer.

## Verification and evals

```sh
npm run check            # tests, rubric, generated docs, schemas, links, assets, mock eval, privacy
npm run check:eval       # mock eval harness only (no model calls)
mkdocs build --strict    # docs site
```

- `verify.mjs` checks invariants, cross-artifact consistency, mutation tests, and fixtures. A hard failure means do not deliver.
- `eval.mjs` is a manual, blind, cross-model **judgment calibration**, not a CI benchmark. Do not add paid model calls to CI. Use `--mock` to test the comparison and reporting logic.
- If a golden score changes, update the fixture deliberately and explain why in the pull request and `CHANGELOG.md`.

## Change map

| Change | Files to touch |
|---|---|
| Add or change a check | `rubric.json`, journey/supporting-system mapping, generated files, `test_score.py`, docs |
| Change weights or caps | `rubric.json`, golden fixture, `docs/scoring.md`, `CHANGELOG.md` |
| Change scoring behavior | `score.py`, `test_score.py`, `docs/scoring.md` |
| Change report layout | `render.mjs`, `v2-one-page-template.md`, `v2-report-template.md`, `examples/acme-plumbing/` |
| Change verification | `verify.mjs`, its mutation suite, `docs/architecture.md` |
| Change the docs site | `docs/`, `mkdocs.yml`, `docs/assets/extra.css`, `requirements-docs.txt` |
| Change brand assets | `docs/assets/`, `scripts/render_docs_assets.mjs`, then `npm run render:assets` |

## Agent skill

The audit workflow lives in `.opencode/skills/home-service-website-audit/SKILL.md`. If your harness does not auto-discover `.opencode/skills/`, read that file directly before auditing. The skill is a workflow, not a substitute for `verify.mjs` or the repository checks.

## Before you commit

- Run `npm run check` and `mkdocs build --strict`.
- Run `verify.mjs` if a report or run changed.
- Update `CHANGELOG.md` for user-visible changes.
- Include no client data, credentials, screenshots, or raw evidence.
- If a rubric version or score changed, call it out explicitly in the pull request.
