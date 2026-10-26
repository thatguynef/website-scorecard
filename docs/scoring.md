# Scoring

The score answers: **how well does the observable website support the customer revenue journey?** It is not a count of best practices.

Canonical machine-readable source: `.opencode/skills/home-service-website-audit/references/rubric.json`.

## Categories and weights

| Category | Weight | What it measures |
|---|---|---|
| A. Understand | 20 | Can a visitor understand the service, location, outcome, offer, and next step? |
| B. Contact | 22 | Can a ready visitor become a lead through phone, form, scheduler, or an alternate channel? |
| C. Respond and Book | 16 | Does the visible experience set response expectations, capture enough context, and support booking/estimate steps? |
| D. Trust | 15 | Are reviews, proof, licensing, guarantees, and identity credible enough to act? |
| E. Mobile and Technical | 15 | Can the customer actually use the site on a phone? |
| F. Findability | 8 | Can a qualified local buyer discover useful pages? |
| G. Measurement | 4 | Can lead-generation activity be measured? |
| **Total** | **100** | |

The weights are deliberately not equal. Contact and understanding carry the most weight because a leak there most directly stops a ready buyer. Measurement is real but smaller; a site can be commercially useful without perfect attribution.

## Item weights

See `references/rubric.md` for all 40 scored checks. Item maxima sum to their category weight when every optional module is enabled.

High-weight examples:

- Service clarity (4)
- Form friction (3), form usability (3), form exists (3), click-to-call (3), scheduler (3)
- Response/acknowledgement promise (3)
- Mobile LCP (4), mobile layout (4), tap targets (3), broken conversion path (3)
- Review volume/source (4)

## Applicability

Each check is one of:

| Level | Behavior |
|---|---|
| **Required** | Always scored. Cannot be marked N/A. |
| **Recommended** | Scored by default. Can be excluded only through `configuration.excludedChecks` with a reason. |
| **Conditional** | Scored only when its module is enabled in `configuration.optionalChecks` (or, for language, when `preferredLanguages` contains more than one language and no explicit override). |

Conditional modules:

- Language access (`RL-UND-08`)
- SMS (`RL-CON-03`)
- Chat/callback (`RL-CON-09`)
- After-hours/emergency (`RL-RSP-02`, default on)
- Licensing (`RL-TRU-04`, default on)

Unscored opportunity modules (never affect the 100-point score): financing, video/VSL, membership, tiered packages, priority service, detailed pricing transparency, content freshness, lead magnet, referral program, paid-traffic landing experience.

## Normalization math

For each category with applicable checks:

```text
applicable_max = sum of item.max for applicable checks in the category
earned         = sum of item.score for applicable checks in the category
normalized     = category.weight × earned ÷ applicable_max
```

If an entire category has no applicable checks, its weight is removed from the denominator:

```text
total = sum(normalized) × 100 ÷ sum(category.weight for categories with applicable checks)
```

Then:

```text
cap   = lowest active hard cap, or 100
final = min(total, cap)
display = round(final)          # nearest integer
band  = band_for(display)
```

Rounding:

- Category `normalized` values are rounded to 2 decimals.
- `total` and `final` are rounded to 1 decimal.
- `display` is the final rounded to the nearest integer.
- Bands use `display`.

### Why normalize?

If a site is not configured for Spanish, SMS, or chat, those checks should not count as zero. Removing them from the denominator and keeping the category weight preserves the meaning of the category:

- A category with 3 applicable checks out of 4 is scored on those 3.
- The category still contributes its full weight to the total.
- The site is not rewarded for having fewer checks, and it is not punished for an irrelevant module.

### Worked example: Acme Plumbing (synthetic)

Configuration: English-only, SMS off, chat/callback off, after-hours on, licensing on.

| Category | Earned | Applicable max | Weight | Normalized |
|---|---|---|---|---|
| Understand | 13 | 18 | 20 | 14.44 |
| Contact | 17 | 20 | 22 | 18.70 |
| Respond and Book | 11 | 16 | 16 | 11.00 |
| Trust | 9 | 15 | 15 | 9.00 |
| Mobile and Technical | 8 | 15 | 15 | 8.00 |
| Findability | 5 | 8 | 8 | 5.00 |
| Measurement | 2 | 4 | 4 | 2.00 |
| **Total** | | | **100** | **68.14 → 68.1 → display 68** |

The language, SMS, and chat checks are N/A and removed from the denominator. The owner-data questions do not appear in this table at all.

## Performance diagnostics

`RL-MOB-01` scores median mobile LCP. The collector also records CLS, TTFB, TBT, and INP when Lighthouse provides them. Those metrics are diagnostic evidence, not separate scored items. A slow LCP is the clearest revenue signal; CLS/INP/TTFB can explain the cause and should appear in the evidence appendix.

Accessibility blockers that affect conversion (clipped controls, unlabeled inputs, an unreachable submit button) are scored through `RL-MOB-02` and `RL-CON-06`. This is not a full WCAG audit and should not be presented as one.

## Hard caps

Caps prevent a severe failure from receiving a misleadingly high score. The lowest active cap wins and the report must state it.

| Cap | Max | Condition | Why |
|---|---|---|---|
| `no_contact` | 30 | No usable phone, form, scheduler, or chat anywhere | Without a contact path the site cannot produce a lead. |
| `primary_contact_broken` | 50 | The primary contact path is advertised but broken/unusable | A dead end is worse than a clearly absent feature. |
| `form_unusable` | 55 | The main lead form cannot be completed | The primary lead capture is blocked. |
| `booking_failure` | 60 | Advertised booking/scheduler is empty, dead, or a dead end | High-intent visitors are explicitly invited into a failure. |
| `mobile_unusable` | 55 | Broken navigation, severe overflow, or clipped conversion controls on mobile | Most local traffic is mobile; an unusable mobile experience blocks the journey. |
| `https_failure` | 40 | No HTTPS, certificate failure, or security failure | Browser warnings destroy trust before the offer loads. |
| `malicious_redirect` | 20 | Redirect to unrelated or malicious content | The site is not safely usable. |
| `unclear_offer` | 65 | No understandable service proposition above the fold on mobile and desktop | A visitor cannot self-qualify. |

Caps are applied after normalization, not before. A site with a perfect observable score and a broken primary contact path still caps at 50.

Without a cap, a site could score 90 while missing every lead path. That is the failure mode caps exist to prevent.

## Bands

| Display score | Band | Label |
|---|---|---|
| 90–100 | A | Elite |
| 75–89 | B | Strong |
| 60–74 | C | Average |
| 40–59 | D | Weak |
| 0–39 | F | Critical |

The band is a communication device, not a business guarantee. A 68 means "there is real observable leakage"; it does not mean the contractor is losing exactly 32% of revenue.

## Owner data never affects the score

The rubric's `ownerData` entries (speed-to-lead, estimate follow-up, close rate, reactivation, referrals, marketing attribution, etc.) are not items. They are never summed, never capped, and never reduce the 100-point score.

A report may say:

> Estimate follow-up — Owner Data Required.

It must not say:

> Estimate follow-up: 0/5.

## Fix prioritization

The report should not show 30 findings as equally important. Rank fixes with:

```text
priority = impact × confidence ÷ effort
```

Suggested scales:

- **Impact** 1–5: how many stages or ready buyers it affects.
- **Confidence** 1–3: verified, strong signal, owner data required (owner-data items are investigations, not fixes).
- **Effort** 1–3: S/M/L.

Lead with the three biggest leaks. Put the full list in the supporting report.

## Legacy V1 scores

V1 uses a direct 42-check point sum with its own caps and bands. It is preserved at `references/legacy/rubric-v1.1.3.json` and scored by the same `score.py` with auto-detection.

Do not compare a V1 score with a V2 score. The checks, weights, applicability, and caps differ. Historical reports keep their rubric version. A re-audit under V2 gets a new run ID and an explicit explanation of the change.

## What not to do

- Do not add N/A checks to the numerator as zero.
- Do not drop the category weight when an optional check is excluded.
- Do not invent a score for an owner-data question.
- Do not let an auto score override a screenshot.
- Do not change the rubric silently. Version it.
