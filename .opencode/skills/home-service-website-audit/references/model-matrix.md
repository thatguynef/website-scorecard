# Cross-Model Eval — Model Matrix

Prices are USD per million tokens, from the OpenCode model catalog on **2026-10-25**. Refresh with `opencode models` before a run; providers change prices and credits.

## Recommended set

| Role | Model | Input | Output | Why |
|---|---|---|---|---|
| Auditor A | `opencode/deepseek-v4.1-flash-free` | $0 | $0 | Free; strong structured JSON; DeepSeek family |
| Auditor B | `opencode/mimo-v2.6-flash-free` | $0 | $0 | Free; different family; reliable JSON in testing |
| Auditor C | `opencode/qwen3.8-flash` | $0.15 | $0.47 | Cheap; Alibaba family; different from A/B |
| Judge | `opencode/gpt-6-luna` | $0.10 | $0.50 | Cheap, different family, strong instruction-following |

**Command:**

```sh
node .opencode/skills/home-service-website-audit/scripts/eval.mjs \
  --snapshot .audit/example/<run-id> \
  --models "opencode/deepseek-v4.1-flash-free,opencode/mimo-v2.6-flash-free,opencode/qwen3.8-flash" \
  --judge opencode/gpt-6-luna \
  --out evals/$(date +%F)
```

**Cost:** judgment-only, ~13 checks, roughly 6k input and 1k output per auditor, plus the judge. The set above costs roughly **$0.01–0.03 per eval**, dominated by Qwen and the judge. A free-only run costs $0 but is more rate-limited and less reliable.

## Zero-cost alternative

| Role | Model |
|---|---|
| Auditor A | `opencode/deepseek-v4.1-flash-free` |
| Auditor B | `opencode/mimo-v2.6-flash-free` |
| Auditor C | `opencode/glm-5.3-flash-free` |
| Judge | `opencode/gpt-6-luna` ($0.10/$0.50) or a free model |

Zero-cost judges are weaker. GLM-5.3 Flash Free produced invalid JSON on a 10-check prompt during testing; retry it or use MiMo instead.

## Cheap paid alternatives

| Model | Input | Output | Note |
|---|---|---|---|
| `opencode/gpt-6-luna` | $0.10 | $0.50 | Recommended judge; also usable as an auditor if the judge is another model |
| `opencode/qwen3.8-flash` | $0.15 | $0.47 | Recommended third auditor |
| `opencode/gpt-5.4-nano` | $0.20 | $1.25 | OpenAI family |
| `opencode/minimax-m3` | $0.30 | $1.20 | MiniMax family |
| `opencode/gemini-3.5-flash-lite` | $0.30 | $2.50 | Google family |
| `anthropic/claude-haiku-5-5` | $0.10 | $0.50 | Only if the account has Anthropic credits |

## Judge alternatives

| Model | Input | Output | Note |
|---|---|---|---|
| `opencode/gpt-6-luna` | $0.10 | $0.50 | Recommended |
| `deepseek/deepseek-v4-pro` | $0.66 | $1.98 | Budget judge; same family as Auditor A |
| `opencode/gpt-6.1-sol` | $2.00 | $10.00 | Stronger, pricier; different family |
| `opencode/gemini-3.1-pro` | $2.00 | $12.00 | Different family |

## Rules

1. **Three auditors, three families.** Two is the minimum; three gives a meaningful spread.
2. **The judge must not be an auditor.** Self-preference bias is real.
3. **Do not use two free models from the same family.** Correlated errors look like agreement.
4. **Free models rate-limit and sometimes emit invalid JSON.** The harness records the failure; retry or swap the model. A run with a failed model is partial, not a clean data point.
5. **Text evidence is the source of truth.** Not every cheap model has vision; `signals.json` carries the visual facts in text, and the prompt inlines them.
6. **Judge only a sample.** The default V2 set covers service clarity, outcome clarity, click-to-call, form friction, conversion dead ends, response promises, qualification, reviews, testimonials, mobile layout, local search, measurement, and language applicability. Add ambiguous checks with `--checks`.
7. **Compare confidence states, not just points.** A model that scores the same point value but labels a finding `verified` when it should be `strong_signal` is not in agreement. The summary reports confidence disagreement separately.
8. **Re-run after every rubric edit.** The harness is periodic, not per client.
