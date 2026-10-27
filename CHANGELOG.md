# Changelog

All notable changes to the Website Scorecard are documented here.

## 2.0.0 — 2026-10-26

### Added

- Revenue Leak Framework with 12 customer-journey stages and six supporting systems.
- V2 rubric: 40 scored checks, 12 owner-data prompts, optional modules, and service mappings.
- Applicability-aware category normalization: N/A checks are removed from the denominator without score inflation.
- Evidence states: VERIFIED, STRONG SIGNAL, OWNER DATA REQUIRED, NOT APPLICABLE.
- Configurable language access (not a hardcoded Spanish penalty).
- Conditional SMS, chat/callback, after-hours, and licensing modules.
- Optional opportunity modules for financing, video, membership, tiers, paid priority, pricing transparency, content freshness, lead magnets, referral programs, and paid-traffic landing experience.
- New V2 hard caps: `primary_contact_broken`, `form_unusable`, `booking_failure`, `https_failure`, `malicious_redirect`, `unclear_offer`.
- Machine-readable coverage matrix (`references/coverage-matrix.json`) generated from the canonical rubric.
- JSON Schemas for audit and scores documents.
- One-page and full-report renderer with V2 templates.
- V2 verifier with 14 mutation tests and V1/V2 golden fixture checks.
- Single `npm run audit` entrypoint, `npm run doctor`, and privacy scan.
- Public documentation set: methodology, framework, scoring, evidence, architecture, configuration, development, schema, privacy, migration.
- Synthetic V2 example (`examples/acme-plumbing`) and sanitized legacy V1 example.
- CI workflow for tests, rubric validation, generated-doc freshness, privacy scan, and the synthetic example.

### Changed

- Public identity moved from "42-check Hormozi rubric" to "Website Revenue Leak Scorecard".
- Score categories changed to Understand, Contact, Respond and Book, Trust, Mobile and Technical, Findability, Measurement.
- Contact and understanding carry more weight than pricing architecture or content freshness.
- Reports lead with the three biggest revenue leaks, then journey, findings, owner-data opportunities, and next steps.
- Client report artifacts are grouped into `reports/<domain>/<run-id>/` packages; raw evidence stays in `.audit/`.
- Report dates and default run IDs use local time instead of UTC.
- `reports/*`, `evals/*`, `.audit/`, and `audit-screens/` are local by default.
- The README now describes a public repository and removes the stale "keep it private" instruction.

### Preserved

- Deterministic scoring, evidence requirements, mobile+desktop collection, Lighthouse median, hard caps, report rendering, verification, mutation testing, golden fixtures, cross-model eval, immutable runs, and non-destructive inspection.
- Legacy V1 rubric, fixtures, scorer path, verifier, and example.

### Security / privacy

- Removed real named client audits, reports, and cross-model eval snapshots from the current tree.
- Replaced client fixtures with sanitized placeholders.
- Added a privacy scan and public-repository data rules.
- Nested report packages under `reports/<domain>/<run-id>/`, eval runs, and local `config/*.json` files are ignored; a pipeline test guards the rules.
- **Public repository was deleted and recreated from a clean root commit on 2026-10-26.** The old commit is not available in the new repository. Earlier revisions contained real client audit artifacts, public business contact details, and two third-party scheduler embed keys; old clones and forks may still retain copies. Delete and re-clone, and treat the old embed keys as exposed. See `docs/privacy.md`.

## 1.1.3 — 2026-10-24

- Legacy 42-check Hormozi rubric, V1 scorer, V1 verifier, V1 golden fixtures.
- Preserved at `references/legacy/rubric-v1.1.3.json` for historical reproducibility.
