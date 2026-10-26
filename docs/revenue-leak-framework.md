# Revenue Leak Framework

The framework follows the customer journey from the first visit to repeat business. Each stage asks a business question, lists what the public site can show, and separates the owner-data questions that cannot be scored.

Machine-readable source: `references/rubric.json` (`journey`, `items`, `ownerData`). Derived matrix: `references/coverage-matrix.json`.

## The journey

| # | Stage | Customer question | Observable in this audit | Owner data |
|---|---|---|---|---|
| 1 | Visitor | Can I find and load the right page? | Title/meta/H1, indexability, local schema, mobile speed/layout, HTTPS | — |
| 2 | Understanding | Do I know what is sold, where, for whom, and what to do next? | Service, location, outcome, primary action, offer anchor, service navigation, language access, project proof, identity | — |
| 3 | Lead | Can I contact the business without friction or a dead end? | Phone, click-to-call, SMS, form, form friction/usability, scheduler, conversion dead ends, chat/callback, measurement tags | — |
| 4 | Response | What happens after I reach out, and how fast? | Response/acknowledgement promise, after-hours/emergency path | Median first response, response by source, missed calls, attempts, after-hours handling |
| 5 | Qualification | Does the lead flow capture enough context to route the job without over-asking? | Form fields and routing context | Which fields are used, spam/out-of-area rate, where leads land |
| 6 | Booking | Can I book or request an appointment without confusion? | Scheduler/booking path, steps, mobile usability, confirmation expectations, visible trust | Real capacity, reschedules, confirmation owner, unavailable-slot handling |
| 7 | Estimate / Opportunity | Can I request an estimate and understand what happens next? | Estimate/quote workflow, scope capture, next step | Open estimates, value, turnaround, acceptance rate, estimate requests never answered |
| 8 | Follow-up | Are open estimates and quiet leads followed up until a decision? | Not observable | Follow-up percentage, speed, attempts, channels, segmentation, stale-estimate reactivation, lost reasons |
| 9 | Customer | What happens after the job is sold and completed? | Not observable | Customer history, job/equipment age, post-job check-in, second-service rate |
| 10 | Review | Does the public experience show credible customer proof? | Review rating/count/source/profile link, specific testimonials, project proof | Review request timing, channel, measurement, negative-feedback capture |
| 11 | Referral | Is there a visible path for a happy customer to refer someone? | Public referral page/offer/CTA if present (observed but not universally scored) | Referral asks, attribution, incentives, partner tracking |
| 12 | Reactivation | Are past customers and unsold estimates brought back? | Maintenance/membership/seasonal signals if present (optional) | Inactive customers, unsold estimates, seasonal opportunities, maintenance eligibility, replacement cycles |

## Supporting systems

The journey is supported by six cross-cutting systems that can leak revenue at any stage:

- **Trust and proof** — reviews, testimonials, real project proof, licensing, guarantees, identity.
- **Mobile usability** — layout, tap targets, readable text, persistent action.
- **Technical conversion health** — HTTPS, broken CTAs/links/forms/schedulers, JavaScript errors.
- **Local search discoverability** — title/meta/H1, canonical/robots/sitemap, LocalBusiness/Service schema, NAP, unique service/location content.
- **Marketing measurement** — analytics, conversion events, call/form tracking, ads tags, and paid-traffic landing experience. Presence is observable; attribution quality and ad spend are not.
- **Language access** — configurable preferred languages, not a hardcoded Spanish penalty.

## How stages appear in the report

Each stage is one of:

- **Scored** — the public site provides enough evidence for a score.
- **Scored + owner data** — the public site has observable checks, and the stage also has owner-data questions.
- **Owner data required** — the stage is not responsibly observable from the public site. The report shows questions, not a score.
- **Observed, unscored** — a public signal exists but is not part of the universal score (for example, a referral page or membership plan). It can appear as an opportunity.

The report must not display an empty stage as if it were a failure. A stage that cannot be observed is an investigation opportunity.

## The two outputs

Every audit produces two different things:

1. **Website score / 100** — only observable checks. Optional modules are excluded when not applicable.
2. **Revenue opportunities to investigate** — owner-data questions, prioritized by likely revenue impact and confidence.

This distinction is the most important change from the legacy 42-check rubric. A good website with unknown internal processes should score well and still produce owner-data opportunities.

## Live teardown use

A live Revenue Leak Teardown should use the same 12 stages and load a completed Scorecard. Walk the owner through:

1. The three biggest observable leaks.
2. The evidence for each.
3. The stages that are scored and the stages that need owner data.
4. The questions to ask before prescribing a fix.
5. The next three actions by impact × confidence ÷ effort.

Do not use different terminology for the Scorecard, the live teardown, and the client diagnosis. They are the same business concept.
