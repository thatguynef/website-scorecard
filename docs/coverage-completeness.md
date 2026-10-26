# Coverage Completeness

This table proves that no important journey stage disappears simply because the public website cannot prove it. Statuses use the five categories from the framework.

| Area | Status | Where it lives |
|---|---|---|
| Visitor understanding | SCORED | `RL-UND-01`, `RL-UND-03` |
| Service clarity | SCORED | `RL-UND-01` |
| Service area | SCORED | `RL-UND-02`, `RL-UND-07`, `RL-FND-04` |
| Primary action / CTA | SCORED | `RL-UND-04` |
| Phone | SCORED | `RL-CON-01`, `RL-CON-02` |
| SMS | CONDITIONAL | `RL-CON-03` (module off by default) |
| Forms | SCORED | `RL-CON-04`, `RL-CON-05`, `RL-CON-06` |
| Chat / callback | CONDITIONAL | `RL-CON-09` (module off by default) |
| Booking | SCORED | `RL-CON-07`, `RL-RSP-03`, `RL-RSP-04` |
| Lead acknowledgement | SCORED + OWNER DATA | `RL-RSP-01`; actual response time in `OD-SPEED-TO-LEAD` |
| Response expectations | SCORED + OWNER DATA | `RL-RSP-01`, `RL-RSP-02`; `OD-AFTER-HOURS` |
| Qualification | SCORED + OWNER DATA | `RL-RSP-05`; `OD-LEAD-QUALITY` |
| Estimate process | SCORED + OWNER DATA | `RL-RSP-06`; `OD-ESTIMATE-PIPELINE`, `OD-CLOSE-RATE` |
| Estimate follow-up | OWNER DATA REQUIRED | `OD-ESTIMATE-FOLLOWUP` |
| Trust | SCORED | `RL-TRU-01` through `RL-TRU-06` |
| Reviews | SCORED + OWNER DATA | `RL-TRU-01`, `RL-TRU-02`; `OD-REVIEW-REQUEST` |
| Referrals | OWNER DATA REQUIRED | `OD-REFERRAL`; public referral signals are observed but unscored |
| Repeat business | OWNER DATA REQUIRED | `OD-CUSTOMER-HISTORY` |
| Reactivation | OWNER DATA REQUIRED | `OD-REACTIVATION`; maintenance/membership signals are optional |
| Mobile usability | SCORED | `RL-MOB-01`, `RL-MOB-02`, `RL-MOB-03` |
| Performance | SCORED / DIAGNOSTIC | LCP is scored in `RL-MOB-01`; CLS, INP, TTFB, TBT are diagnostic |
| Accessibility blockers affecting conversion | SCORED (limited) | `RL-MOB-02`, `RL-CON-06`; not a full WCAG audit |
| SEO | SCORED | `RL-FND-01`, `RL-FND-02` |
| Local search | SCORED | `RL-FND-03`, `RL-FND-04` |
| Analytics | SCORED | `RL-MSR-01` |
| Marketing measurement | SCORED + OWNER DATA | `RL-MSR-02` for observable signals; `OD-MARKETING-ATTRIBUTION` for revenue and CAC |
| Paid traffic risk | CONDITIONAL / OBSERVED BUT UNSCORED | `paid_traffic` opportunity module; ads tags in `RL-MSR-02` |
| Customer journey dead ends | SCORED | `RL-CON-08` |
| Language access | CONDITIONAL / NOT APPLICABLE | `RL-UND-08`, configured by preferred languages |
| Financing | CONDITIONAL / OBSERVED BUT UNSCORED | `financing` opportunity module; not a universal penalty |
| Video / VSL | OBSERVED BUT UNSCORED | `video` opportunity module |
| Membership / maintenance | OBSERVED BUT UNSCORED | `membership` opportunity module |
| Tiered packages / VIP | OBSERVED BUT UNSCORED | `tiered_packages` opportunity module |
| Paid priority / same-day | OBSERVED BUT UNSCORED | `priority_service` opportunity module |
| Detailed pricing transparency | OBSERVED BUT UNSCORED | `pricing_transparency` opportunity module; `RL-UND-05` scores only a light anchor |
| Content freshness | OBSERVED BUT UNSCORED | `content_freshness` opportunity module |
| Named lead magnet | OBSERVED BUT UNSCORED | `lead_magnet` opportunity module |
| Referral program | OBSERVED BUT UNSCORED | `referral_program` opportunity module |

## How to read the statuses

- **SCORED** — contributes to the 100-point website score.
- **SCORED + OWNER DATA** — some public evidence is scored, and the business outcome requires a separate question.
- **CONDITIONAL** — scored only when the configuration enables the module; otherwise N/A and excluded from the denominator.
- **OWNER DATA REQUIRED** — never scored; appears in Revenue Opportunities to Investigate.
- **OBSERVED BUT UNSCORED** — can be reported as an opportunity, but does not affect the score.
- **NOT APPLICABLE** — not relevant to this business, market, or configuration.

The machine-readable version of this coverage is `references/coverage-matrix.json`. The rubric is the source of truth.
