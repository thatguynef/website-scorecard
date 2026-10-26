# Public Release Checklist

Use this before changing the repository from private to public or before a major release.

## Repository safety

- [ ] `npm run check:privacy` passes on the current tree.
- [ ] `node scripts/privacy_scan.mjs --history` passes. If it fails, stop and investigate; do not claim history is clean.
- [ ] No `.env`, tokens, cookies, browser profiles, or private keys are tracked.
- [ ] No real client report, audit, screenshot, customer PII, or third-party widget key is in the current tree.
- [ ] `.audit/`, `audit-screens/`, `reports/*.md`, and `evals/*` are ignored.
- [ ] Public examples are synthetic or sanitized and labeled.
- [ ] Any exposed credential has been rotated with the vendor.

## Documentation

- [ ] README first screen explains what, why, and how to run.
- [ ] The README does not say "keep it private."
- [ ] `docs/privacy.md` matches the actual repository visibility.
- [ ] All relative links resolve (`npm run check:links`).
- [ ] `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, and `LICENSE` exist.
- [ ] The license is accurate and intentional.

## Scoring and evidence

- [ ] `rubric.json` is the single source of truth.
- [ ] `rubric.md`, `coverage-matrix.json`, and `portable-checklist.md` are current.
- [ ] Generated artifacts fail CI when stale.
- [ ] V1 and V2 golden fixtures pass.
- [ ] Every hard cap has a test.
- [ ] Owner-data questions do not affect the score.
- [ ] Language, SMS, chat, after-hours, and licensing are configurable.
- [ ] Financing, video, memberships, tiers, paid priority, content freshness, and paid traffic are not universal penalties.

## Pipeline

- [ ] `npm run doctor` passes for the maintainer environment.
- [ ] `npm test` passes.
- [ ] The synthetic example verifies with `--mutation --fixture --synthetic`.
- [ ] The collector smoke test produces screenshots, a site map, path traces, and `submitted: false`.
- [ ] A real run records rubric, collector, scorer, run ID, and run timestamp.
- [ ] A real run's verifier exits 0 before delivery.
- [ ] CI does not audit production sites, submit forms, call businesses, or make model calls.

## GitHub settings (manual)

- [ ] Description set to the recommended one-liner.
- [ ] Homepage set.
- [ ] Topics added.
- [ ] Private vulnerability reporting enabled.
- [ ] `main` protected after the history decision.
- [ ] Social preview image added.
- [ ] If history was rewritten, collaborators have been told to re-clone.
- [ ] GitHub Support has been asked to purge cached/unreachable old objects if direct-SHA access remains.

See [`github-settings.md`](github-settings.md) for the recommended values.
