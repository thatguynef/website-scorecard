# Skills Registry

One row per active skill. Keep the catalog small; retire anything unused for 90 days.

| ID | Purpose | Owner | Version | Last verified | Status |
|---|---|---|---|---|---|
| `home-service-website-audit` | Diagnose revenue leaks in a local home-service website with the evidence-based Website Revenue Leak Scorecard (V2), preserving V1 for historical runs | Growth team | 2.0.0 | 2026-10-26 | active |

## Rules

- One job per skill; no overlapping trigger descriptions.
- Prefer extending an existing skill over creating a new one.
- `SKILL.md` stays thin; bulk lives in `references/`, deterministic work in `scripts/`.
- Every skill needs an owner, a version, and a last-verified date.
- Every script needs a golden fixture or a test.
- Never put raw client evidence in this public repository.
- Retire or merge skills that have not been used in 90 days.
