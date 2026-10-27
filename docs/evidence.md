# Evidence Model

> **For:** owners, marketers, and analysts working with local home-service businesses.

The most important rule in this project:

> [!IMPORTANT]
> **A finding without evidence is an opinion.**

The evidence model separates what was observed from what was inferred and what the owner must answer.

## The four states

### VERIFIED

Directly observed or safely tested.

Examples:

- The phone CTA is not a `tel:` link on mobile.
- The contact form has nine visible fields and no labels.
- The booking page returns "Nothing to book right now."
- The mobile page scrolls horizontally at 390px.
- HTTPS fails.
- The H1 is brand-only.

Use VERIFIED when the evidence is visible in the screenshot, DOM, source, link trace, Lighthouse result, or path trace. The business consequence may still be uncertain, but the observation is not.

### STRONG SIGNAL

Evidence strongly suggests a problem, but the actual business outcome cannot be proven from the public site.

Examples:

- No immediate-response mechanism is visible after the form.
- The page makes a response-time promise, but there is no way to verify it.
- The booking path exists but takes an unusual number of steps.
- The testimonials look generic.
- The site shows paid-traffic tags but the landing page is weak.

Use STRONG SIGNAL when the observation is real but the claim "this is losing jobs" would require business data. The report should say what was observed and what cannot be proven.

### OWNER DATA REQUIRED

Cannot responsibly determine from public information.

Examples:

- Median first-response time.
- Percentage of estimates that receive follow-up.
- Number of open estimates.
- Close rate by source.
- Number of inactive customers.
- Marketing spend and revenue by channel.
- Review-request process.
- Referral operations.

These are **not** website failures. They are questions for the owner or CRM. They never reduce the website score.

### NOT APPLICABLE

The check does not reasonably apply to this business, market, or audit configuration.

Examples:

- Spanish access in an English-only market.
- SMS when the business does not accept texts.
- Chat when the intended lead mix is phone and form.
- Licensing in a trade or market where it is not a meaningful buyer concern.
- Financing when the trade is low-ticket.

N/A checks are removed from the denominator. They are not scored as zero.

## Rules of evidence

1. **Screenshot or source citation, or it did not happen.** The report should reference `M-01`, `D-01`, a URL, a DOM fact, a Lighthouse file, or a path trace.
2. **No credit for metadata where the check requires the viewport.** A guarantee in the footer does not satisfy an above-fold check.
3. **Absent is a finding, not an assumption.** Score absent when the evidence shows absence. Do not say "likely available after booking."
4. **Weaker viewport wins.** For mobile+desktop checks, the weaker experience determines the score.
5. **One observation, one score.** Do not double-count the same element across checks unless the rubric explicitly asks for a different placement.
6. **Quote the site verbatim.** Mark proposed copy as **Proposed**.
7. **Flag, do not fix, illegal or non-compliant claims.** Fake reviews, unlicensed claims, and misleading financing terms are findings, not copy opportunities.
8. **Do not confuse "not observed" with "does not exist."** The site may have an internal process that is not public.

## Evidence types

| Type | What it proves | Example |
|---|---|---|
| `screenshot` | What a visitor saw at a viewport | Mobile hero, form, reviews section |
| `dom` | The underlying markup | `tel:` href, field count, autocomplete, tap target size |
| `source` | Page source or metadata | Title, canonical, robots, schema, analytics tags |
| `link` | A reachable or broken path | Scheduler, estimate page, review profile |
| `lighthouse` | Measured performance | Median mobile LCP across 3 runs |
| `copy` | What the page says | Response promise, guarantee, service area |
| `path_trace` | A non-destructive traversal | Call/text/form/book/estimate observations |
| `owner_data` | Business data outside the site | Response time, open estimates, close rate |

## Confidence assignment

| Evaluation type | Default confidence | Notes |
|---|---|---|
| Deterministic | VERIFIED | `tel:`, field count, HTTPS, H1, LCP, viewport overflow |
| Model judgment (observable) | VERIFIED | Clarity, form friction, trust quality — the thing itself is visible |
| Model judgment (outcome inference) | STRONG SIGNAL | "No immediate acknowledgement mechanism observed" |
| Owner data | OWNER DATA REQUIRED | Never scored |
| Excluded module | NOT APPLICABLE | Score is null, denominator adjusted |

A model must not use `owner_data_required` for a scored check. If the check cannot be observed, it does not belong in the scored set; move the question to the owner-data section.

## What belongs in the report

### Website Findings

Only scored checks with VERIFIED or STRONG SIGNAL evidence. Include the check ID, stage, score, confidence, what was observed, and the fix.

### Revenue Opportunities to Investigate

Only owner-data questions. Include the stage, why it matters, and the specific questions. Do not attach a score.

### Limitations

State what the audit could not determine: CRM response time, call handling, booking capacity, estimate follow-up, customer history, marketing spend, closed revenue.

## Language access

Language is configurable. If the audit configuration says the market needs Spanish (or Mandarin, Vietnamese, French, or another language), the language check is scored. If not, it is N/A and removed from the denominator.

Do not hardcode Spanish as a universal penalty. Do not claim a business does not serve a language community just because the site is English-only; report the observable access gap.

## Common mistakes

| Mistake | Correction |
|---|---|
| "The business responds slowly." | "No immediate acknowledgement mechanism was observed. Actual response time requires owner data." |
| "They do not follow up on estimates." | "Estimate follow-up is not observable. Add it to the owner-data questions." |
| "No Spanish = 0/4." | "Spanish access is N/A unless the market configuration enables it." |
| "The form is broken." | "The form has no visible submit control" (verified) or "the form is hard to complete" (verified friction) — distinguish broken from friction. |
| "The site is not trustworthy." | Cite the specific trust signal that is missing; do not make a character judgment. |
| "The booking path is slow." | "The booking path takes five steps and opens a third-party page" — describe the observable friction. |

---

**Next:** [Coverage completeness](coverage-completeness.md) — the area-by-area map.
