# Evaluation

> **For:** maintainers and auditors who want to know whether the judgment layer is stable.

The cross-model eval tests the **judgment layer**, not a client report. It is periodic and manual. CI runs only the mock path, which makes no model calls.

## What it tests

The eval is blind: evidence is inlined into the prompt, with no tools, browsing, or project files. Auditors score the same judgment-heavy checks independently. A separate judge model decides the reference answer.

It samples judgment-heavy V2 checks, including CTA clarity, form friction, trust quality, customer-journey depth, language applicability, and the distinction between `VERIFIED` and `STRONG SIGNAL`.

It does not change a score, select a service, or evaluate owner-data questions. Deterministic facts are not re-judged.

## Mock run

```sh
npm run check:eval
```

This is the same as:

```sh
node .opencode/skills/home-service-website-audit/scripts/eval.mjs \
  --mock \
  --snapshot examples/acme-plumbing \
  --out /tmp/website-scorecard-eval-mock
```

The mock uses the fixture’s judgment checks and a deliberate disagreement. It proves the harness can detect disagreement; it is not a quality measurement. `npm run check` and CI run this path, so a broken eval path fails before delivery.

## Real cross-model run

```sh
node .opencode/skills/home-service-website-audit/scripts/eval.mjs \
  --snapshot .audit/<slug>/<run-id> \
  --models "model-a,model-b,model-c" \
  --judge "model-d" \
  --out evals/$(date +%F)
```

Use a frozen audit run with the evidence available. The judge must differ from the auditors. Real runs require model access and may cost money; keep them out of CI.

## How to read the output

| Result | Meaning |
|---|---|
| Exact | All auditors agree with the judge |
| Spread 1 | A note, not a rubric change |
| Spread > 1 | The anchor is ambiguous; tighten the rubric text and rerun |
| Confidence disagreement | The score matches but the evidence state does not; re-read `docs/evidence.md` |
| Failure | An auditor returned invalid JSON or was rate-limited; the run is partial, not clean |

The run directory contains `report.md`, `summary.json`, per-model prompts and raw output, and the judge’s output. Read `report.md` first.

## Rules

- The eval is judgment-only and blind. Do not give the auditor the project files or browsing tools.
- The judge must be a different model from the auditors.
- Owner-data questions are never evaluated.
- Deterministic facts are never re-judged.
- Public eval fixtures are synthetic or sanitized.
- Never put paid model calls in CI. Use `--mock` there.
- A spread greater than one is a signal to clarify the rubric, not to change a score by hand.

## Privacy

`evals/*` is gitignored except `evals/README.md`. An eval result can contain client evidence even when the prompt does not. Keep real runs local. If you publish one, use a synthetic snapshot and label it clearly.

The full runbook is in [`evals/README.md`](https://github.com/thatguynef/website-scorecard/blob/main/evals/README.md).

## Related

- [Judgment layer](judgment.md)
- [Evidence model](evidence.md)
- [Development](development.md)
