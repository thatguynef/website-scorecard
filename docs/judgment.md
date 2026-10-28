# Judgment Layer

> **For:** reviewers and auditors who fill the non-deterministic checks.

Most of the score is deterministic. The collector writes `audit.json` with the judgment checks left `null`; a reviewer or model fills them. This page explains the boundary, the workflow, and the rules. The canonical step-by-step instructions are in `SKILL.md` under “Review and fill judgment.”

## What needs judgment

Judgment-heavy checks include CTA clarity, form friction, trust quality, customer-journey depth, language applicability, and the distinction between `VERIFIED` and `STRONG SIGNAL`. The exact set is defined in `.opencode/skills/home-service-website-audit/references/rubric.json` by `evaluation: model_judgment`.

This repository does not use a separate `judgment.json`. Fill `audit.filled.json` directly.

## Workflow

1. Run the audit with `--prepare` so the collector writes `audit.filled.json`.
2. Read the mobile screenshots first, then desktop. Use the DOM signals and Lighthouse data only as supporting evidence.
3. Fill every applicable `null` check in `audit.filled.json`.
4. Set `needs_review` to `false`.
5. Run `score.py --strict`.
6. Render and verify the report.

## What a filled check looks like

```json
"RL-UND-01": {
  "score": 2,
  "evidence": ["M-01: hero names the service and the city."],
  "confidence": "verified",
  "applicable": true
}
```

Every scored check needs an allowed integer score, at least one evidence string, a confidence state, and `applicable: true`.

## Rules

- **Evidence or it did not happen.** Cite a screenshot, DOM signal, or page source.
- **Absent is a finding, not an assumption.** Report what is missing without claiming why.
- **The weaker viewport wins** on any check that covers both mobile and desktop.
- **Do not mark a required check N/A.** N/A is for configured optional modules only.
- Use `verified` for directly observed problems and `strong_signal` when the evidence strongly suggests a problem but the business outcome cannot be proven.
- Owner-data questions go in the report, never into the score.
- Do not claim “responds slowly,” “loses estimates,” or “wastes ad spend” without evidence.
- Do not change a deterministic check, a metric, or another check’s score.
- Do not use prose as a substitute for a score.
- Do not leave applicable checks `null` or `needs_review` true.

## Not applicable

An N/A check needs `applicable: false`, `score: null`, `confidence: not_applicable`, and a reason:

```json
"RL-UND-08": {
  "score": null,
  "evidence": [],
  "confidence": "not_applicable",
  "applicable": false,
  "na_reason": "multilingual access not configured for this market"
}
```

## Why not everything is judgment

A score that depends on a model’s prose for every check is harder to reproduce and easier to manipulate. Deterministic observations stay deterministic. Judgment is reserved for classification questions that structured parsing cannot settle.

## Evaluation

The cross-model eval tests whether reviewers agree on the judgment checks. It is a calibration tool, not a delivery gate and not a leaderboard. See [Evaluation](eval.md).

## Related

- [Run an audit](run-an-audit.md)
- [Evidence model](evidence.md)
- [Evaluation](eval.md)
- [The Scorecard Family](scorecard-family.md)
