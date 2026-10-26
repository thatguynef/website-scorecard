# Cross-Model Evals

Cross-model evals test the **judgment layer**, not a client report. They are periodic and manual, not part of standard CI.

A run directory contains:

- `report.md` — agreement table, confidence disagreement, ambiguous checks, one-point disagreements
- `summary.json` — machine-readable rows, deltas, confidence mismatches, failures
- `models/<label>-<model>/` — prompt, signals, raw output, parsed result
- `judge/` — judge prompt, evidence, raw output, parsed result

**Run:**

```sh
node .opencode/skills/home-service-website-audit/scripts/eval.mjs \
  --snapshot .audit/<slug>/<run-id> \
  --models "opencode/deepseek-v4.1-flash-free,opencode/mimo-v2.6-flash-free,opencode/qwen3.8-flash" \
  --judge opencode/gpt-6-luna \
  --out evals/$(date +%F)
```

**Dry run:** `npm run eval -- --mock --snapshot examples/acme-plumbing --out /tmp/eval-mock` tests the comparison/report logic without model calls.

**Read it like this:**

- **Exact** — all models agree with the judge.
- **Spread 1** — a note, not a rubric change.
- **Spread > 1** — the anchor is ambiguous; tighten it and rerun.
- **Confidence disagreement** — the score may match, but the evidence state does not. Re-read `docs/evidence.md`.
- **Failure** — a model did not return valid JSON or was rate-limited; the run is partial, not clean.

The eval is judgment-only and blind: evidence is inlined into the prompt, no tools, no browsing, no project files. The judge is a different model (`opencode/gpt-6-luna` by default).

## Public repository rule

`evals/*` is gitignored except this README. Eval snapshots can contain real client evidence, page text, phone numbers, and third-party widget credentials. Keep real eval runs local. If you publish an eval, use a synthetic snapshot and label it clearly.
