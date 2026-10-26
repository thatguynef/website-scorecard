# Website Revenue Leak Scorecard - Rubric

Version 2.0.0 · 100 points · 40 scored checks · 12 owner-data prompts

> This file is generated from `references/rubric.json`. Do not edit it by hand.

The score answers one question: **where could this contractor be losing customers or revenue?**
It follows the customer journey, separates observable website problems from internal business
opportunities, and never penalizes a site for data the audit cannot see.

Mobile is the primary viewport. When a check lists mobile and desktop, the weaker viewport wins.

## Categories

| ID | Category | Weight | Question |
|---|---|---|---|
| A | Understand | 20 | Can a visitor understand what is offered, where, for whom, and what to do next? |
| B | Contact | 22 | Can a ready visitor become a lead without friction or a dead end? |
| C | Respond and Book | 16 | Does the visible experience support a fast, qualified continuation? |
| D | Trust | 15 | Does the business provide enough credible proof to act? |
| E | Mobile and Technical | 15 | Can the customer actually use the experience on a phone? |
| F | Findability | 8 | Can a qualified local prospect discover useful pages? |
| G | Measurement | 4 | Can lead-generation activity be measured? |

## Scoring math

- **Required:** Always scored. A required check cannot be marked N/A.
- **Recommended:** Scored by default. It may be excluded only through configuration.excludedChecks with a written reason.
- **Conditional:** Scored only when configuration.optionalChecks enables its module; otherwise it is N/A and excluded from the denominator.
- **Rounding:** Category normalized values are rounded to 2 decimals. Total and final are rounded to 1 decimal. The display score is the final rounded to the nearest integer. Bands use the display score.
- **Owner Data:** Owner-data questions are never scored and never reduce the website score.
- **Weaker Viewport:** When a check lists mobile and desktop, the weaker viewport determines the score.

**Normalization:** For each category with applicable checks: normalized = category.max * earned / applicable_max. Total = sum(normalized) * 100 / sum(category.max for categories with applicable checks). Caps apply after normalization.

## Caps

| Cap | Maximum | Condition |
|---|---|---|
| `no_contact` | 30 | No usable contact path anywhere (phone, form, scheduler, or chat) |
| `primary_contact_broken` | 50 | The primary contact path is advertised but broken or unusable |
| `form_unusable` | 55 | The main lead form cannot be completed |
| `booking_failure` | 60 | The advertised booking or scheduler path is empty, dead, or a dead end |
| `mobile_unusable` | 55 | The mobile site is unusable (broken navigation, severe overflow, or clipped conversion controls) |
| `https_failure` | 40 | The site is not served over HTTPS or has a certificate/security failure |
| `malicious_redirect` | 20 | The site redirects to unrelated or malicious content |
| `unclear_offer` | 65 | No understandable service proposition above the fold on mobile and desktop |

## Bands

| Score | Band | Label |
|---|---|---|
| 90+ | A | Elite |
| 75+ | B | Strong |
| 60+ | C | Average |
| 40+ | D | Weak |
| 0+ | F | Critical |

## Customer journey coverage

| # | Stage | Coverage | Scored checks | Owner-data prompts |
|---|---|---|---|---|
| 1 | Visitor | scored | RL-FND-01, RL-FND-02, RL-FND-03, RL-MOB-01, RL-MOB-02, RL-MOB-04 | - |
| 2 | Understanding | scored | RL-UND-01, RL-UND-02, RL-UND-03, RL-UND-04, RL-UND-05, RL-UND-06, RL-UND-07, RL-UND-08, RL-FND-04, RL-TRU-03, RL-TRU-06 | - |
| 3 | Lead | scored | RL-CON-01, RL-CON-02, RL-CON-03, RL-CON-04, RL-CON-05, RL-CON-06, RL-CON-07, RL-CON-08, RL-CON-09, RL-MOB-03, RL-MOB-05, RL-MSR-01, RL-MSR-02 | - |
| 4 | Response | scored_plus_owner_data | RL-RSP-01, RL-RSP-02 | OD-SPEED-TO-LEAD, OD-AFTER-HOURS |
| 5 | Qualification | scored_plus_owner_data | RL-RSP-05 | OD-LEAD-QUALITY |
| 6 | Booking | scored_plus_owner_data | RL-RSP-03, RL-RSP-04, RL-TRU-04, RL-TRU-05 | OD-BOOKING-CAPACITY |
| 7 | Estimate / Opportunity | scored_plus_owner_data | RL-RSP-06 | OD-ESTIMATE-PIPELINE, OD-CLOSE-RATE |
| 8 | Follow-up | owner_data_required | - | OD-ESTIMATE-FOLLOWUP |
| 9 | Customer | owner_data_required | - | OD-CUSTOMER-HISTORY |
| 10 | Review | scored_plus_owner_data | RL-TRU-01, RL-TRU-02 | OD-REVIEW-REQUEST |
| 11 | Referral | owner_data_required | - | OD-REFERRAL |
| 12 | Reactivation | owner_data_required | - | OD-REACTIVATION |

## Supporting systems

- **Trust and proof:** RL-TRU-01, RL-TRU-02, RL-TRU-03, RL-TRU-04, RL-TRU-05, RL-TRU-06
- **Mobile usability:** RL-MOB-01, RL-MOB-02, RL-MOB-03
- **Technical conversion health:** RL-MOB-04, RL-MOB-05
- **Local search discoverability:** RL-FND-01, RL-FND-02, RL-FND-03, RL-FND-04
- **Marketing measurement:** RL-MSR-01, RL-MSR-02
- **Language access:** RL-UND-08

## A. Understand - 20 points

### RL-UND-01 - Service clarity - 4 points
*Stage: understanding · Evaluation: model_judgment · Applicability: required · Severity: critical · Legacy: A1*
*Viewports: mobile, desktop · Evidence: M-01, D-01; quote the hero copy · Service: revenue_recovery*
*Recommended intervention: Name the service in the hero in plain language.*

- **4** - The first viewport names the service in plain language on mobile and desktop. A homeowner can say what is sold without scrolling.
- **2** - The service is named only after scrolling, or only in jargon or a brand slogan.
- **1** - Brand name or slogan only; a visitor must guess what is sold.
- **0** - Neither the service nor a recognizable category is visible on the page.

### RL-UND-02 - Location and service-area clarity - 3 points
*Stage: understanding · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: A6, F4*
*Viewports: mobile, desktop · Evidence: Hero, footer, contact page, service-area page · Service: market_intelligence*
*Recommended intervention: State the city/service area and add local proof.*

- **3** - The city or region, a service radius or area list, and one local proof signal are visible. A visitor can tell whether they are eligible.
- **2** - A city is named, but the service area or local proof is missing.
- **1** - Only a broad region or county is named, with no way to judge eligibility.
- **0** - No location signal on the site.

### RL-UND-03 - Customer problem and outcome clarity - 3 points
*Stage: understanding · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: A1, A5*
*Viewports: mobile, desktop · Evidence: Hero, first scroll, service page intro · Service: revenue_recovery*
*Recommended intervention: Name the customer problem and the outcome.*

- **3** - The page names the customer's problem, the outcome, and who it is for in specific language.
- **2** - It names the problem or the outcome, but not both, or the customer is vague.
- **1** - Generic quality claims only (family owned, best service, trusted).
- **0** - No problem, outcome, or customer signal.

### RL-UND-04 - Primary action clarity - 3 points
*Stage: understanding · Evaluation: model_judgment · Applicability: required · Severity: critical · Legacy: A2, B1*
*Viewports: mobile, desktop · Evidence: M-01, D-01 · Service: revenue_recovery*
*Recommended intervention: Use one dominant next step above the fold.*

- **3** - One dominant next step is visible above the fold on mobile and desktop, and secondary actions do not compete with it.
- **2** - The next step is visible on one viewport only, or two actions have equal visual weight.
- **1** - The next step requires scrolling, or is buried among three or more competing actions.
- **0** - No clear next step anywhere on the page.

### RL-UND-05 - Offer specificity and price anchor - 2 points
*Stage: understanding · Evaluation: model_judgment · Applicability: recommended · Severity: medium · Legacy: A3, D1*
*Viewports: mobile, desktop · Evidence: Hero, offer section, pricing page · Service: revenue_recovery*
*Recommended intervention: Add a starting-at price or range for a core job.*

- **2** - A named offer includes a price, starting-at price, or range.
- **1** - A named offer exists, but there is no price or range.
- **0** - No named offer, or only a generic free estimate.

### RL-UND-06 - Service navigation - 2 points
*Stage: understanding · Evaluation: model_judgment · Applicability: required · Severity: high*
*Viewports: mobile, desktop · Evidence: Mobile menu, header nav, service pages · Service: market_intelligence*
*Recommended intervention: Put the top services in the main navigation.*

- **2** - The main services are reachable in two taps or fewer, and at least one service page exists with relevant content.
- **1** - Services are reachable in three taps, or only from a long menu with no dedicated pages.
- **0** - No service navigation, or service links are broken.

### RL-UND-07 - Service-area eligibility navigation - 1 point
*Stage: understanding · Evaluation: model_judgment · Applicability: required · Severity: low · Legacy: F4*
*Viewports: mobile, desktop · Evidence: Service areas page, footer, contact page · Service: market_intelligence*
*Recommended intervention: Add a service-area list, map, or ZIP check.*

- **1** - A service-area list, city page, map, or ZIP check lets a visitor confirm eligibility.
- **0** - No way to confirm whether the visitor's location is served.

### RL-UND-08 - Language access - 2 points
*Stage: understanding · Evaluation: deterministic · Applicability: conditional · Severity: high · Legacy: A7*
*Viewports: mobile, desktop · Evidence: Mobile menu/footer first, then desktop; language switcher, /es/, hreflang, notice · Service: market_intelligence*
*Recommended intervention: Add the configured language path and translate conversion pages.*

- **2** - Every configured preferred language is reachable in two taps or fewer, with translated home and conversion pages.
- **1** - A language notice or one translated page exists, but the conversion path is not translated or is hard to reach.
- **0** - No visible access to a configured preferred language.


## B. Contact - 22 points

### RL-CON-01 - Phone visible and consistent - 3 points
*Stage: lead · Evaluation: model_judgment · Applicability: required · Severity: critical · Legacy: B2*
*Viewports: mobile, desktop · Evidence: M-01, contact page, footer · Service: speed_to_lead*
*Recommended intervention: Use one visible phone number consistently.*

- **3** - A phone number is visible on the home and contact pages, and the same number appears in both places.
- **2** - A phone number is visible, but numbers differ or the contact page is missing it.
- **1** - The number is buried in the footer or on one page only.
- **0** - No phone number is visible.

### RL-CON-02 - Click-to-call on mobile - 3 points
*Stage: lead · Evaluation: deterministic · Applicability: required · Severity: critical · Legacy: B2*
*Viewports: mobile · Evidence: href scan on mobile · Service: speed_to_lead*
*Recommended intervention: Make the mobile phone a tel: link in a persistent action.*

- **3** - A working tel: link is visible in the header, hero, or sticky action bar.
- **1** - A tel: link exists, but it is buried or only on a secondary page.
- **0** - No tel: link; the phone is plain text.

### RL-CON-03 - Text/SMS path - 1 point
*Stage: lead · Evaluation: deterministic · Applicability: conditional · Severity: low · Legacy: B2, B8*
*Viewports: mobile · Evidence: href scan on mobile · Service: speed_to_lead*
*Recommended intervention: Add a working sms: link when SMS is enabled.*

- **1** - A working sms: link is visible in a sensible lead path.
- **0** - No sms: link, or the link is broken.

### RL-CON-04 - Form exists and is reachable - 3 points
*Stage: lead · Evaluation: model_judgment · Applicability: required · Severity: critical · Legacy: B3*
*Viewports: mobile, desktop · Evidence: Contact/quote page, mobile path · Service: speed_to_lead*
*Recommended intervention: Make the lead form reachable in two taps.*

- **3** - A lead form is reachable in two taps or fewer from the home page and renders with visible fields.
- **2** - A form exists but is buried, only on a secondary page, or only reachable from the footer.
- **1** - Only an account-gated or third-party form exists.
- **0** - No form anywhere on the site.

### RL-CON-05 - Form friction - 3 points
*Stage: lead · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: B3*
*Viewports: mobile, desktop · Evidence: Count visible fields; list required fields · Service: speed_to_lead*
*Recommended intervention: Cut fields to name, phone, ZIP, and problem.*

- **3** - Five or fewer fields, no account creation, and no irrelevant required fields.
- **2** - Six to eight fields, or one unnecessary required field or account step.
- **1** - Nine or more fields, multiple unnecessary required fields, or an account required before contact.
- **0** - The form requires a lengthy intake, payment, or impossible information before a human can respond.

### RL-CON-06 - Form usability - 3 points
*Stage: lead · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: E6*
*Viewports: mobile · Evidence: Form DOM, mobile screenshot · Service: speed_to_lead*
*Recommended intervention: Add labels, input types, autocomplete, and a reachable submit.*

- **3** - Labels are visible, inputs use correct types and autocomplete, validation is understandable, and the submit control is reachable on mobile.
- **1** - One usability problem: a missing label, wrong input type, no autocomplete, or a submit button that requires extra scrolling.
- **0** - Two or more problems, or the submit control is not reachable.

### RL-CON-07 - Online scheduler or booking - 3 points
*Stage: lead · Evaluation: model_judgment · Applicability: recommended · Severity: high · Legacy: B3, E4*
*Viewports: mobile, desktop · Evidence: Book/quote path trace; do not submit · Service: speed_to_lead*
*Recommended intervention: Add a working scheduler with live availability.*

- **3** - A working scheduler with live availability is reachable in two taps or fewer and usable on mobile.
- **2** - A scheduler exists, but it takes extra steps, requires an account, or is confusing on mobile.
- **1** - Only an appointment-request form exists; no live availability.
- **0** - No scheduler or booking path.

### RL-CON-08 - No conversion dead end - 2 points
*Stage: lead · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: G4*
*Viewports: mobile, desktop · Evidence: End of each crawled high-intent page · Service: revenue_recovery*
*Recommended intervention: End every high-intent page with a next step.*

- **2** - Every high-intent page (home, service, about, contact) ends with a clear next step or persistent action.
- **1** - Some high-intent pages end without a next step.
- **0** - High-intent pages routinely end with no action, or the primary action is broken.

### RL-CON-09 - Chat or callback request - 1 point
*Stage: lead · Evaluation: deterministic · Applicability: conditional · Severity: low · Legacy: B8*
*Viewports: mobile, desktop · Evidence: Widget inspection; do not send a message · Service: speed_to_lead*
*Recommended intervention: Add a human-backed chat or callback when enabled.*

- **1** - A human-backed chat, callback request, or equivalent alternate channel is visible and does not block the page.
- **0** - No alternate channel, or only a dead bot.


## C. Respond and Book - 16 points

### RL-RSP-01 - Response and acknowledgement promise - 3 points
*Stage: response · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: B7*
*Viewports: mobile, desktop · Evidence: Form area, contact page, confirmation copy · Service: speed_to_lead*
*Recommended intervention: Publish a response time, channel, and hours.*

- **3** - An explicit promise states the response time, channel, and hours (for example, 'We call back within 15 minutes, 7am-7pm').
- **2** - An explicit response time is stated, but the channel or hours are missing.
- **1** - Only vague language ('we will be in touch soon').
- **0** - No acknowledgement or response expectation.

### RL-RSP-02 - After-hours or emergency path - 2 points
*Stage: response · Evaluation: deterministic · Applicability: conditional · Severity: high*
*Viewports: mobile, desktop · Evidence: Header, contact page, footer · Service: speed_to_lead*
*Recommended intervention: State hours and the after-hours or emergency path.*

- **2** - Hours plus an after-hours or emergency path (phone, form, or explicit next step) are visible.
- **1** - Hours are visible, but there is no after-hours or emergency path.
- **0** - Neither hours nor an after-hours path is visible.

### RL-RSP-03 - Booking path steps and mobile usability - 3 points
*Stage: booking · Evaluation: model_judgment · Applicability: required · Severity: critical · Legacy: E4*
*Viewports: mobile, desktop · Evidence: Mobile path trace; no appointment selected · Service: speed_to_lead*
*Recommended intervention: Reduce booking steps and keep the path on-site.*

- **3** - Book or quote is reachable in two taps or fewer and completes without an account or confusing third-party transition.
- **2** - Three taps, or one unnecessary step or confusing transition.
- **1** - Four or more taps, or a dead end that requires the visitor to start over.
- **0** - The booking path is broken or cannot be completed.

### RL-RSP-04 - Confirmation expectations - 2 points
*Stage: booking · Evaluation: model_judgment · Applicability: required · Severity: medium*
*Viewports: mobile, desktop · Evidence: Form area, booking page, confirmation copy · Service: speed_to_lead*
*Recommended intervention: State what happens after submission and when.*

- **2** - The page states what happens after submission and when, including a confirmation channel.
- **1** - Generic 'we will contact you' language only.
- **0** - No confirmation or next-step expectation.

### RL-RSP-05 - Qualification context without over-asking - 3 points
*Stage: qualification · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: B3, G1, G2*
*Viewports: mobile, desktop · Evidence: Form fields, quote flow, service page FAQs · Service: speed_to_lead*
*Recommended intervention: Capture service, ZIP or area, problem, and contact preference.*

- **3** - The flow captures the service, ZIP or service area, problem, and a contact preference without asking for irrelevant or excessive data.
- **2** - The flow captures enough to route the lead but misses one useful field.
- **1** - The flow captures too little to route the job, or too much before a human can respond.
- **0** - No usable qualification path.

### RL-RSP-06 - Estimate or quote request workflow - 3 points
*Stage: estimate · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: B4, G1*
*Viewports: mobile, desktop · Evidence: Estimate/quote page, service pages · Service: revenue_recovery*
*Recommended intervention: Add an estimate request with scope and a clear next step.*

- **3** - A clear estimate request captures scope and offers a sensible next step (upload, photos, or scheduling) without forcing a full intake.
- **2** - A quote request or contact form exists, but scope or next step is unclear.
- **1** - Phone-only estimate request with no visible form or path.
- **0** - No estimate or quote path.


## D. Trust - 15 points

### RL-TRU-01 - Review volume, source, and profile link - 4 points
*Stage: review · Evaluation: model_judgment · Applicability: required · Severity: high · Legacy: C1, F6*
*Viewports: mobile, desktop · Evidence: Reviews section, profile link, M-01 · Service: revenue_recovery*
*Recommended intervention: Show rating, count, source, and a profile link.*

- **4** - A rating, review count, named external source, and a link that opens the review profile are visible; 50+ reviews at 4.5+.
- **2** - A rating and count are visible, but the count is under 50 or there is no external review-platform link.
- **1** - Three to ten handwritten testimonials, with no aggregate rating or source.
- **0** - No reviews, testimonials, or proof.

### RL-TRU-02 - Specific testimonials and case studies - 3 points
*Stage: review · Evaluation: model_judgment · Applicability: recommended · Severity: medium · Legacy: C2*
*Viewports: mobile, desktop · Evidence: Reviews page, service pages, case studies · Service: revenue_recovery*
*Recommended intervention: Add named stories with job type and outcome.*

- **3** - Three or more stories include a name or photo, job type, and a specific outcome.
- **2** - One or two specific stories.
- **1** - Generic quotes only.
- **0** - No testimonials or case studies.

### RL-TRU-03 - Real project proof - 2 points
*Stage: understanding · Evaluation: model_judgment · Applicability: recommended · Severity: medium · Legacy: C3*
*Viewports: mobile, desktop · Evidence: Gallery, service pages · Service: revenue_recovery*
*Recommended intervention: Caption real job photos with city, job, and result.*

- **2** - Five or more real job photos, with captions, location, or before/after context.
- **1** - Stock photos, or an uncaptioned gallery with no job context.
- **0** - No project photos.

### RL-TRU-04 - License, insurance, and certifications - 2 points
*Stage: booking · Evaluation: deterministic · Applicability: conditional · Severity: medium · Legacy: C4*
*Viewports: mobile, desktop · Evidence: About, footer, contact page · Service: revenue_recovery*
*Recommended intervention: Show license, insurance, and relevant certifications.*

- **2** - A license number, an insurance or bond statement, and a relevant certification are visible.
- **1** - One of the three is visible.
- **0** - None is visible. Do not infer legitimacy from an absent badge.

### RL-TRU-05 - Guarantee and warranty specificity - 2 points
*Stage: booking · Evaluation: model_judgment · Applicability: recommended · Severity: medium · Legacy: A4, C6*
*Viewports: mobile, desktop · Evidence: CTA block, service page, footer · Service: revenue_recovery*
*Recommended intervention: State the warranty term and scope.*

- **2** - A specific workmanship or material guarantee with a term and scope is visible near the buying path.
- **1** - The word guarantee or warranty appears, but the term or scope is missing, or it is buried in the footer.
- **0** - No guarantee or warranty signal.

### RL-TRU-06 - Identity and differentiation consistency - 2 points
*Stage: understanding · Evaluation: model_judgment · Applicability: recommended · Severity: medium · Legacy: A5, C5*
*Viewports: mobile, desktop · Evidence: About page, hero, footer, contact page · Service: revenue_recovery*
*Recommended intervention: Use one identity and one verifiable differentiator.*

- **2** - A real owner or team identity and one verifiable differentiator appear consistently across the site.
- **1** - One of the two is present, or the identity is inconsistent across pages.
- **0** - Neither is present, or the business identity changes between pages.


## E. Mobile and Technical - 15 points

### RL-MOB-01 - Mobile LCP - 4 points
*Stage: visitor · Evaluation: deterministic · Applicability: required · Severity: high · Legacy: E1*
*Viewports: mobile · Evidence: Lighthouse mobile, median of at least three runs · Service: cost_compression*
*Recommended intervention: Compress the hero and defer non-critical scripts.*

- **4** - Median mobile LCP is at or under 2.5 seconds.
- **2** - Median mobile LCP is 2.5 to 4.0 seconds.
- **0** - Median mobile LCP is over 4.0 seconds.

### RL-MOB-02 - Mobile layout usability - 4 points
*Stage: visitor · Evaluation: deterministic · Applicability: required · Severity: critical · Legacy: E2, E5*
*Viewports: mobile · Evidence: M-01 to M-04, viewport metrics · Service: cost_compression*
*Recommended intervention: Fix viewport, text size, clipping, and menu usability.*

- **4** - No horizontal overflow, readable body text, no clipped conversion controls, and the menu opens.
- **2** - One layout problem that does not block the primary action.
- **1** - Two layout problems, or one that makes the primary action hard to use.
- **0** - Three or more problems, or the mobile experience is unusable.

### RL-MOB-03 - Tap targets and persistent action - 3 points
*Stage: lead · Evaluation: deterministic · Applicability: required · Severity: high · Legacy: E3*
*Viewports: mobile · Evidence: Tap-target scan, mobile screenshots · Service: speed_to_lead*
*Recommended intervention: Use 44px targets and a persistent action.*

- **3** - Primary tap targets are at least 44px and a call/book action is persistently reachable.
- **2** - Targets are mostly adequate, but the primary action requires scrolling back to the top.
- **1** - Small targets and a buried primary action.
- **0** - The primary action is not usable on mobile.

### RL-MOB-04 - HTTPS and security - 1 point
*Stage: visitor · Evaluation: deterministic · Applicability: required · Severity: critical*
*Viewports: site · Evidence: URL, certificate, redirect trace · Service: cost_compression*
*Recommended intervention: Serve HTTPS with a valid certificate.*

- **1** - The site loads over HTTPS with a valid certificate and no unrelated redirect.
- **0** - HTTP only, a certificate failure, or a suspicious redirect.

### RL-MOB-05 - Broken links, CTAs, and conversion-blocking errors - 3 points
*Stage: lead · Evaluation: model_judgment · Applicability: required · Severity: critical*
*Viewports: mobile, desktop · Evidence: Link/CTA trace, console errors, scheduler state · Service: cost_compression*
*Recommended intervention: Fix broken links, CTAs, forms, and conversion-blocking errors.*

- **3** - No conversion-blocking broken links, CTAs, forms, or JavaScript errors observed.
- **2** - A non-blocking broken link or script error exists, but the primary path still works.
- **1** - One primary path is broken, but another contact path works.
- **0** - Multiple conversion paths are broken, or the primary path is a dead end.


## F. Findability - 8 points

### RL-FND-01 - Title, meta description, and H1 - 3 points
*Stage: visitor · Evaluation: deterministic · Applicability: required · Severity: medium · Legacy: F1, F2*
*Viewports: site · Evidence: Page source / SERP preview · Service: market_intelligence*
*Recommended intervention: Put service and city in title, meta, and H1.*

- **3** - Title, meta description, and H1 each combine the primary service and city.
- **2** - Two of the three combine service and city.
- **1** - One of the three does.
- **0** - None does, or the home page has no H1.

### RL-FND-02 - Indexability - 2 points
*Stage: visitor · Evaluation: deterministic · Applicability: required · Severity: high*
*Viewports: site · Evidence: canonical, meta robots, robots.txt, sitemap.xml · Service: market_intelligence*
*Recommended intervention: Fix canonical, robots, and sitemap.*

- **2** - A canonical is present, robots rules allow the page, and a sitemap is reachable.
- **1** - One of the three is missing or ambiguous.
- **0** - The page is noindexed or blocked by robots, or no indexable page is reachable.

### RL-FND-03 - Local schema and NAP consistency - 2 points
*Stage: visitor · Evaluation: deterministic · Applicability: required · Severity: medium · Legacy: F3, F5, F6*
*Viewports: site · Evidence: Schema scan, contact page, footer · Service: market_intelligence*
*Recommended intervention: Add LocalBusiness or Service schema and consistent NAP.*

- **2** - LocalBusiness or Service schema is present and the visible name, address, and phone are consistent.
- **1** - One of the two is present.
- **0** - Neither is present, or the visible NAP conflicts across pages.

### RL-FND-04 - Service and location pages with unique content - 1 point
*Stage: understanding · Evaluation: model_judgment · Applicability: recommended · Severity: low · Legacy: F4*
*Viewports: site · Evidence: Sitemap, service pages, location pages · Service: market_intelligence*
*Recommended intervention: Build unique service and location pages.*

- **1** - At least one service page and one location or service-area page contain unique, useful local content.
- **0** - Only a list of cities, duplicated pages, or no service/location depth.


## G. Measurement - 4 points

### RL-MSR-01 - Analytics present - 2 points
*Stage: lead · Evaluation: deterministic · Applicability: required · Severity: medium*
*Viewports: site · Evidence: Script/source scan · Service: marketing_intelligence*
*Recommended intervention: Install GA4, GTM, or an equivalent analytics platform.*

- **2** - GA4, Google Tag Manager, or an equivalent analytics platform is loaded on the public pages.
- **1** - Some analytics or pixel is present, but no general analytics platform is detectable.
- **0** - No analytics signal detected.

### RL-MSR-02 - Conversion and paid-traffic measurement - 2 points
*Stage: lead · Evaluation: deterministic · Applicability: recommended · Severity: medium*
*Viewports: site · Evidence: Script/source scan · Service: marketing_intelligence*
*Recommended intervention: Add conversion events and ads or call tracking.*

- **2** - Conversion events plus a call/form tracking or ads tag are detectable.
- **1** - One signal is detectable (for example, Google Ads or Meta Pixel only).
- **0** - No conversion or paid-traffic measurement signal is detectable.

## Optional modules

| Module | Scored | Default | Checks | Notes |
|---|---|---|---|---|
| `language_access` | yes | off | RL-UND-08 | Enable when the target market needs a language other than the primary site language. Configure preferredLanguages, for example ["en", "es"]. |
| `sms` | yes | off | RL-CON-03 | Enable when the business accepts texted leads or the market expects SMS. |
| `chat_callback` | yes | off | RL-CON-09 | Enable when a human-backed chat or callback channel is part of the intended lead mix. |
| `after_hours` | yes | on | RL-RSP-02 | Enable for emergency, restoration, HVAC, plumbing, pest, and similar trades. Disable for businesses that do not take urgent work. |
| `licensing` | yes | on | RL-TRU-04 | Enable where licensing or insurance is a meaningful buyer concern. It is scored only on visible claims. |
| `financing` | no | off | - | High-ticket trades may benefit. It is an opportunity flag and owner-data question, not a universal score penalty. |
| `video` | no | off | - | A video can help some offers, but its absence is not a revenue leak for every trade. Report it as an opportunity only. |
| `membership` | no | off | - | A continuity offer is valuable when the trade has recurring service needs. It is not a universal score requirement. |
| `tiered_packages` | no | off | - | Useful for some offers, irrelevant for others. Report as an opportunity, not a penalty. |
| `priority_service` | no | off | - | An optional revenue architecture choice. Report when it fits the trade and market. |
| `pricing_transparency` | no | off | - | A price anchor is scored lightly in Understand. A full price list is optional and should be investigated, not assumed. |
| `content_freshness` | no | off | - | Fresh advice content can help search and trust, but it is not a universal revenue-leak penalty. |
| `lead_magnet` | no | off | - | A named low-friction offer can help. Report as an opportunity when the current offer is only a generic free estimate. |
| `referral_program` | no | off | - | Public referral signals are sparse. Treat referral operations as an owner-data opportunity. |
| `paid_traffic` | no | off | - | Enable when ads are known to point at the site. Inspect landing-page relevance, CTA, phone/form, speed, mobile usability, and measurement. Never invent ad spend or performance. |

## Owner-data prompts (never scored)

### OD-SPEED-TO-LEAD - Speed-to-lead
*Stage: response · Service: speed_to_lead · Confidence: owner data required*

A fast first response is often the difference between a booked job and a competitor's job. The public site cannot prove response time.

- What is the median time from lead to first human response?
- How does that change by lead source (call, form, chat, text, ads)?
- Who owns new leads during business hours and after hours?
- How many contact attempts are made before a lead is abandoned?
- How many inbound calls are missed or abandoned each week?

### OD-AFTER-HOURS - After-hours and emergency handling
*Stage: response · Service: speed_to_lead · Confidence: owner data required*

Emergency demand does not wait for office hours. A visible emergency path is not proof that a human answers it.

- What happens to a call or form submitted after hours?
- Is there an on-call rotation or answering service?
- What percentage of after-hours leads become jobs?
- Are emergency jobs priced or prioritized differently?

### OD-LEAD-QUALITY - Lead quality and routing
*Stage: qualification · Service: speed_to_lead · Confidence: owner data required*

A form can collect data and still fail to route the right job to the right person.

- Which form fields are actually used to qualify or route a lead?
- What percentage of form leads are spam, out of area, or the wrong service?
- Where do form leads land, and who sees them?
- What information is missing most often when the office calls back?

### OD-BOOKING-CAPACITY - Booking capacity and confirmation
*Stage: booking · Service: speed_to_lead · Confidence: owner data required*

An online booking can create a bad customer experience if the calendar is wrong or the office cannot absorb the slot.

- How many booked jobs are rescheduled or cancelled each week?
- Is the online calendar connected to real crew capacity?
- Who confirms appointments, and when?
- What happens when the requested slot is unavailable?

### OD-ESTIMATE-PIPELINE - Estimate pipeline
*Stage: estimate · Service: revenue_recovery · Confidence: owner data required*

Open estimates are often the largest recoverable revenue pool. The website cannot show how many exist.

- How many estimates are currently open?
- What is the total value of open estimates?
- What is the average time from request to estimate delivered?
- What percentage of estimates are accepted?
- What percentage of estimate requests never receive an estimate?

### OD-CLOSE-RATE - Estimate close rate by source and size
*Stage: estimate · Service: revenue_recovery · Confidence: owner data required*

The same website can produce very different revenue depending on close rate, job size, and lead source.

- What is the close rate by lead source?
- What is the close rate by job size or service line?
- What is the average job value?
- Which objections appear most often on estimates?
- Which lost reasons are recorded?

### OD-ESTIMATE-FOLLOWUP - Estimate follow-up
*Stage: follow_up · Service: revenue_recovery · Confidence: owner data required*

Unclosed estimates are a high-value opportunity that a public website audit cannot observe.

- What percentage of open estimates receive follow-up?
- How quickly is the first follow-up made?
- How many attempts are made before follow-up stops?
- Which channels are used (call, text, email)?
- Are estimates segmented by size, service, or age?
- Are stale estimates reactivated on a schedule?

### OD-CUSTOMER-HISTORY - Customer history and job completion
*Stage: customer · Service: customer_reactivation · Confidence: owner data required*

Repeat and referral revenue depends on knowing who bought, what was installed, and when the next service is due.

- How many past customers are in the CRM?
- Is job history, equipment age, and service date recorded?
- Is there a post-job check-in?
- How many customers buy a second service within 12 months?

### OD-REVIEW-REQUEST - Review requests
*Stage: review · Service: revenue_recovery · Confidence: owner data required*

A strong review profile is public, but the review-request process is not.

- Are customers automatically asked for a review?
- How soon after the job is the ask made?
- Is the ask sent by SMS, email, or in person?
- Is the process measured by technician or job type?
- Is negative feedback captured before it becomes a public review?

### OD-REFERRAL - Referral operations
*Stage: referral · Service: customer_reactivation · Confidence: owner data required*

Referrals are often the lowest-cost lead source, but they are rarely visible on the website.

- Do you ask for referrals? When and how?
- Is there a referral offer or tracking method?
- What percentage of new customers come from referrals?
- Are referral partners (realtors, property managers, adjacent trades) tracked?
- Is referral follow-up owned by someone?

### OD-REACTIVATION - Reactivation and repeat business
*Stage: reactivation · Service: customer_reactivation · Confidence: owner data required*

Old leads, unsold estimates, and inactive customers can produce revenue without new ad spend.

- How many past customers are inactive for 12+ months?
- How many unsold estimates are older than 30, 60, or 90 days?
- Are seasonal services or maintenance visits scheduled automatically?
- Is there a maintenance plan or membership list?
- Has anyone contacted the inactive list in the last year?

### OD-MARKETING-ATTRIBUTION - Marketing attribution and channel profitability
*Stage: response · Service: marketing_intelligence · Confidence: owner data required*

Tags can show that traffic arrived; only business data can show which channel produces closed revenue.

- Is lead source recorded on every lead and job?
- Can you report cost per lead, cost per booked job, and cost per closed job by channel?
- Do you know revenue by channel?
- Which campaigns produced jobs in the last 90 days?
- How much is spent on ads, and what is the return?

## Service mappings

| ID | Label | Description |
|---|---|---|
| `revenue_recovery` | Revenue Recovery | Recover revenue from open estimates, unsold opportunities, and conversion leaks. |
| `speed_to_lead` | Speed-to-Lead | Improve response time, routing, booking, and lead handling. |
| `customer_reactivation` | Customer Reactivation | Bring back inactive customers and past opportunities. |
| `market_intelligence` | Market Intelligence | Improve local visibility, service-area clarity, and market positioning. |
| `marketing_intelligence` | Marketing Intelligence | Connect lead sources, measurement, and channel profitability. |
| `cost_compression` | Cost Compression | Reduce waste from slow, broken, or unusable digital experiences. |
