# The Scorecard Family

> **For:** owners, marketers, and analysts who need to know which diagnostic answers which question.

Website Scorecard is the conversion layer of a coordinated family. It sits beside [Local Visibility Scorecard](https://thatguynef.github.io/local-visibility-scorecard/) and [GBP Scorecard](https://thatguynef.github.io/gbp-scorecard/) without copying their jobs.

```text
LOCAL VISIBILITY SCORECARD
Can prospective customers discover the business?
Search · Maps · AI answers · competitors · authority
                 ↓
GBP SCORECARD
Does the Google Business Profile create trust and enable action?
Identity · Services · Reviews · Content · Conversion · Handoff
                 ↓
WEBSITE SCORECARD
Can the owned website convert that demand?
UX · Trust · Mobile · Contact · Booking · Measurement
                 ↓
RAD
Remediation and operations live elsewhere.
```

## What this scorecard answers

Can a ready-to-buy visitor understand the offer, contact the business, and book a job without friction? The website is the owned surface. It is scored on what the public page can prove; the profile and discovery surfaces are separate diagnostics.

## What belongs only to Website Scorecard

- Website UX, mobile layout, page speed, accessibility, forms, navigation, and content depth.
- Website conversion paths, including form usability and on-site scheduling.
- Website analytics and tag configuration.
- On-site schema and technical implementation.
- Website-specific hard caps, including broken primary contact, unusable forms, booking failure, HTTPS failure, malicious redirects, and an unclear offer.
- Website-specific evidence: screenshots, DOM signals, Lighthouse, path traces, and page-level copy.

## What belongs only to Local Visibility Scorecard

- Local Pack and Google Maps visibility.
- Geo-grid and local finder observations.
- Organic ranking and ranking-URL relevance for local commercial intent.
- AI answer inclusion, recommendation, and citation behavior.
- Competitor share of local visibility.
- External citation and authority footprint outside the profile.
- Visibility concentration and reproducible trends.

## What belongs only to GBP Scorecard

- Google Business Profile identity, categories, services, hours, attributes, and media.
- Review recency, velocity, distribution, and owner responses.
- Profile action paths: call, website, booking, messaging, directions.
- The Google → destination handoff.
- Profile-origin attribution signals.
- Owner-data questions about calls, messages, bookings, reviews, and profile revenue.

## What is deliberately shared

| Convention | Shared rule |
|---|---|
| Scale | 0–100, seven weighted categories, A–F bands |
| Bands | A 90–100 · B 75–89 · C 60–74 · D 40–59 · F 0–39 |
| Evidence states | `VERIFIED` · `STRONG SIGNAL` · `OWNER DATA REQUIRED` · `NOT APPLICABLE` |
| Public score | Owner-data questions never reduce it |
| N/A handling | N/A checks leave the denominator; weights are renormalized |
| Pipeline | Collect → Review → Score → Render → Verify. Each stage is independently runnable |
| Outputs | `audit.json`, `audit.filled.json`, `scores.json`, `one-page.md`, `full-report.md`, `verification.json` |
| Judgment | Model judgment is isolated; deterministic facts are not re-judged |
| Determinism | Same inputs produce the same score and the same tables |
| Privacy | Raw evidence and client reports stay local; public examples are synthetic or sanitized |
| Visual system | Ink `#0B0B0C`, Surface `#141416`, Card `#1C1C1F`, Paper `#F7F7F5`, Muted `#A6A6AA`, Brand Red `#FF3B3B`, Soft Red `#FF8F8F`, Green `#3FBF7F`, Amber `#F5C766` |
| Voice | Calm, direct, evidence-based. Observed, not observed, may create friction, owner data required |
| Hard caps | Only for extreme conversion or technical failures; each is deterministic, tested, and documented |
| RAD boundary | RAD mappings are metadata. The scorecard is useful without RAD |

## No duplicate scoring

| Question | Website Scorecard | GBP Scorecard | Local Visibility |
|---|---|---|---|
| Page speed and mobile UX | SCORE | — | — |
| Forms, CTA usability, booking flow | SCORE | — | — |
| On-site schema and technical implementation | SCORE | — | — |
| Website conversion tracking | SCORE | — | — |
| Review widget on the website | SCORE | — | — |
| HTTPS and destination technical health | SCORE | handoff check | — |
| GBP category, services, hours, attributes, media | — | SCORE | explanatory only |
| GBP reviews and owner responses | — | SCORE | — |
| GBP phone, website, booking, messaging action | — | SCORE | — |
| GBP-to-website handoff | — | SCORE | — |
| Local Pack, Maps, and geo-grid visibility | — | — | SCORE |
| Organic rank and ranking URL | explanatory only | — | SCORE |
| AI mention, recommendation, citation | — | — | SCORE |
| Competitor share of local visibility | — | — | SCORE |
| Search Console clicks, leads, revenue | OWNER DATA REQUIRED | OWNER DATA REQUIRED | OWNER DATA REQUIRED |

The only intentional overlap is HTTPS. Website Scorecard judges whether the owned site is technically sound; GBP Scorecard judges whether the advertised handoff works. A dead destination caps the GBP handoff; it is not counted twice in the website score.

## What a Website finding looks like

> The estimate form's submit button is clipped below 390px, so a mobile visitor cannot complete the form.

Do **not** add:

> The GBP primary category is weak.

Instead:

> Cross-reference GBP Scorecard if the profile's relevance or configuration needs diagnosis.

## What the other scorecards may say

Local Visibility may say:

> The water-heater page has no top-10 visibility for the target market.

Website Scorecard may say:

> The water-heater page has weak mobile conversion.

Those are separate findings. They are not merged into one number.

## Deliberate divergence

Website weights **Contact at 22**, because the owned site's job is to produce a lead or a booked job. GBP weights **Conversion & Actionability at 22**, because a profile's job is to produce a next step. Local Visibility weights **Maps & Local Pack at 25**, because local-business results are the densest discovery surface for a home-service business.

All three use seven categories so a business owner can compare the shape of the diagnosis, not the underlying checks.

## How to use the family

Run the scorecard for the surface where the customer is losing the most. The order is diagnostic, not mandatory: strong discovery can still lead to a weak profile or a weak website, and the reverse is also possible.

## Future boundary

The family may eventually feed machine-readable findings into RAD:

```json
{
  "finding": "RL-CON-05",
  "recommended_modules": ["revenue_recovery"]
}
```

The scoring engines remain separate. RAD consumes findings; it does not merge the rubrics or rewrite a public score with private operational metrics.

## Published sites and source

- [Website Scorecard docs](https://thatguynef.github.io/website-scorecard/) · [source](https://github.com/thatguynef/website-scorecard)
- [Local Visibility Scorecard docs](https://thatguynef.github.io/local-visibility-scorecard/) · [source](https://github.com/thatguynef/local-visibility-scorecard)
- [GBP Scorecard docs](https://thatguynef.github.io/gbp-scorecard/) · [source](https://github.com/thatguynef/gbp-scorecard)
