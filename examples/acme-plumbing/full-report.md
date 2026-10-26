# Website Revenue Leak Audit — Acme Plumbing (synthetic)

**URL:** https://acme-plumbing.example/
**Trade:** Plumbing
**Market:** Example County, CA
**Audit date:** October 26, 2026
**Rubric:** v2.0.0
**Collector:** v2.0.0
**Scorer:** v2.0.0
**Run ID:** 2026-10-26T1000
**Run timestamp:** 2026-10-26T10:00:00Z
**Viewports:** mobile 390×844, desktop 1440×900

**Score:** 68 / 100 — Average



## Executive summary

- Acme Plumbing has the hard parts: a consistent phone path, a working scheduler, visible licensing, and basic analytics.
- The biggest observable leak is form friction on mobile, followed by a missing response expectation after submission.
- The largest unknown is estimate follow-up. It is presented as an owner-data opportunity, not a website penalty.
- Fix the form and the callback promise first; they are cheap, fast, and directly on the path to a booked job.

## The three biggest revenue leaks

### 1. Mobile estimate form is difficult to complete

**Stage:** Lead

**What is happening:** Six fields, one missing label, and weak autocomplete on phone and ZIP.

**Evidence:** Six fields; submit is visible, so the form works but is harder than needed.

**Why it matters:** Extra fields and unclear inputs lower completion on a phone.

**Fix:** Cut it to name, phone, ZIP, and problem; add autocomplete and labels.

**Confidence:** VERIFIED

---

### 2. New inquiries have no observable immediate acknowledgement

**Stage:** Response

**What is happening:** The form says only "We will be in touch soon." No time, channel, or hours are promised.

**Evidence:** The form area has generic contact language; the header hours are not connected to a response.

**Why it matters:** A homeowner who submits at 6pm cannot tell whether anyone saw it.

**Fix:** Add one line beside the button: "We call or text within 15 minutes during office hours."

**Confidence:** STRONG SIGNAL

---

### 3. Unclosed estimates may not receive follow-up

**Stage:** Follow-up

**What is happening:** The site can show an estimate request exists. It cannot show what happens next.

**Evidence:** No public page exposes the estimate pipeline, follow-up cadence, or close rate. It is not scored.

**Why it matters:** Open estimates are often the largest recoverable revenue pool.

**Fix:** Pull the open-estimate list, segment by age and value, and assign a follow-up cadence.

**Confidence:** OWNER DATA REQUIRED

## Customer Journey

| Stage | Status | What we observed |
|---|---|---|
| Visitor | Scored | 62.5% of applicable points |
| Understanding | Scored | Service and city are clear; price and outcome language are weak. |
| Lead | Scored | Phone, form, and scheduler work; form friction is the main leak. |
| Response | Scored + owner data | Hours and emergency path visible; no response-time promise. Actual speed needs owner data. |
| Qualification | Scored + owner data | Enough context to route the job; routing and spam rate need owner data. |
| Booking | Scored + owner data | Scheduler works; capacity and confirmation need owner data. |
| Estimate / Opportunity | Scored + owner data | 100% of applicable points |
| Follow-up | Owner data required | Not observable from the public site. |
| Customer | Owner data required | — |
| Review | Scored + owner data | 38 reviews and a profile link are visible; request process needs owner data. |
| Referral | Owner data required | — |
| Reactivation | Owner data required | Inactive customers and unsold estimates are not visible. |

## Score card

| Category | Earned | Applicable | Weight | Normalized |
|---|---|---|---|---|
| A. Understand | 13 | 18 | 20 | 14.44 |
| B. Contact | 17 | 20 | 22 | 18.70 |
| C. Respond and Book | 11 | 16 | 16 | 11.00 |
| D. Trust | 9 | 15 | 15 | 9.00 |
| E. Mobile and Technical | 8 | 15 | 15 | 8.00 |
| F. Findability | 5 | 8 | 8 | 5.00 |
| G. Measurement | 2 | 4 | 4 | 2.00 |
| **Total** | **68.1** | **100** | **100** | **68.10** |

## Website Findings

| ID | Stage | Score | Confidence | What we observed | Fix |
|---|---|---|---|---|---|
| RL-UND-01 | understanding | 2/4 | VERIFIED | M-01: hero says "Plumbing done right" but not the service or city above the fold. | Name plumbing and the city in the hero, not just the brand. |
| RL-UND-02 | understanding | 3/3 | VERIFIED | M-01 and contact page: Example City and a 25-mile service area are visible. | Keep the city and service-area proof. |
| RL-UND-03 | understanding | 2/3 | VERIFIED | M-01 and service page: "fast repairs" is present; the homeowner outcome is vague. | Lead with the homeowner problem and the outcome. |
| RL-UND-04 | understanding | 3/3 | VERIFIED | M-01, D-01: one "Get an estimate" button dominates the hero. | Keep one dominant estimate action. |
| RL-UND-05 | understanding | 0/2 | VERIFIED | M-01, service pages: no price, starting-at price, or range. | Publish a starting-at range for the three most-requested jobs. |
| RL-UND-06 | understanding | 2/2 | VERIFIED | Mobile menu: Services opens a list; drain and water-heater pages are two taps away. | Keep the service menu to two taps. |
| RL-UND-07 | understanding | 1/1 | VERIFIED | Service-area page lists Example City and four neighboring cities. | Keep the service-area list and add a ZIP check. |
| RL-UND-08 | understanding | N/A | NOT APPLICABLE | N/A: multilingual access not configured for this market | Not applicable in this English-only configuration. |
| RL-CON-01 | lead | 3/3 | VERIFIED | M-01, contact page, footer: (555) 010-0200 appears consistently. | Keep the number consistent across home, contact, and footer. |
| RL-CON-02 | lead | 3/3 | VERIFIED | M-01 DOM: tel:+15550100200 in the sticky action bar. | Keep the sticky click-to-call. |
| RL-CON-03 | lead | N/A | NOT APPLICABLE | N/A: optional module disabled for this market | Not applicable; SMS is disabled in this configuration. |
| RL-CON-04 | lead | 3/3 | VERIFIED | Contact page is one tap from the header and renders a six-field form. | Keep the contact page one tap from the header. |
| RL-CON-05 | lead | 2/3 | VERIFIED | Contact form: name, phone, email, ZIP, service, message; message is not required. | Cut the form to four fields: name, phone, ZIP, problem. |
| RL-CON-06 | lead | 1/3 | VERIFIED | Mobile form: labels and input types are present; the ZIP field uses autocomplete="postal-code"; submit is visible. | Add the missing label and autocomplete for phone and ZIP. |
| RL-CON-07 | lead | 3/3 | VERIFIED | Book path: scheduler iframe loads and shows availability; no appointment selected. | Keep the scheduler; remove the third-party redirect. |
| RL-CON-08 | lead | 2/2 | VERIFIED | M-01, service page, about page: each ends with a next step; reviews page relies on the persistent header action. | Add a next step to the reviews page. |
| RL-CON-09 | lead | N/A | NOT APPLICABLE | N/A: optional module disabled for this market | Not applicable; chat/callback is disabled in this configuration. |
| RL-RSP-01 | response | 1/3 | STRONG SIGNAL | Form area: "We will be in touch soon." No time, channel, or hours. | Promise a callback time and channel beside the form. |
| RL-RSP-02 | response | 2/2 | VERIFIED | Header: "Mon-Sat 7am-7pm" plus an emergency call link. | Keep the hours and emergency path. |
| RL-RSP-03 | booking | 2/3 | VERIFIED | Mobile path: book is two taps from the home page; scheduler is usable but opens a third-party page. | Keep the scheduler on-site and reduce the steps. |
| RL-RSP-04 | booking | 1/2 | STRONG SIGNAL | Form area: generic "we will contact you" only. | State what happens after submission and when. |
| RL-RSP-05 | qualification | 2/3 | VERIFIED | Form asks service, ZIP, problem, and phone; no account required. | Keep the routing fields, but make the message optional. |
| RL-RSP-06 | estimate | 3/3 | VERIFIED | Service pages link to "Request an estimate" with a scope field and photo upload. | Keep the scope field and photo upload. |
| RL-TRU-01 | review | 2/4 | VERIFIED | Reviews widget shows 4.7 stars and 38 reviews with a link to the external profile. | Show the Google rating, count, and profile link. |
| RL-TRU-02 | review | 2/3 | VERIFIED | Two named testimonials with job type; no photos or specific numbers. | Add three named case studies with job type and outcome. |
| RL-TRU-03 | understanding | 1/2 | VERIFIED | Gallery has four uncaptioned job photos. | Caption real job photos with city, job, and result. |
| RL-TRU-04 | booking | 2/2 | VERIFIED | Footer: license number, insured statement, and manufacturer badge. | Keep the license, insurance, and certification proof. |
| RL-TRU-05 | booking | 1/2 | VERIFIED | Service page: "warranty" with no term or scope. | State the workmanship warranty term and scope. |
| RL-TRU-06 | understanding | 1/2 | VERIFIED | About page names the owner and a "same-day repair" claim; the footer uses a different company name. | Use one company name and one verifiable differentiator everywhere. |
| RL-MOB-01 | visitor | 2/4 | VERIFIED | Lighthouse mobile median LCP 3.1 s across 3 runs. | Compress the hero and defer third-party scripts. |
| RL-MOB-02 | visitor | 2/4 | VERIFIED | M-01: one hero heading clips at 390px; menu opens; form fields visible. | Unclip the hero heading and test at 390px. |
| RL-MOB-03 | lead | 1/3 | VERIFIED | M-01: sticky call button; three footer links are under 44px. | Increase small footer tap targets to 44px. |
| RL-MOB-04 | visitor | 1/1 | VERIFIED | URL loads over HTTPS with a valid certificate. | Keep HTTPS and the valid certificate. |
| RL-MOB-05 | lead | 2/3 | VERIFIED | One service page link 404s; the primary estimate path still works. | Fix the 404 service-page link. |
| RL-FND-01 | visitor | 2/3 | VERIFIED | Title and meta include plumbing and Example City; H1 is brand-only. | Put plumbing and Example City in the H1. |
| RL-FND-02 | visitor | 2/2 | VERIFIED | Canonical present, robots allow indexing, sitemap.xml returns 200. | Keep canonical, robots, and sitemap. |
| RL-FND-03 | visitor | 1/2 | VERIFIED | LocalBusiness schema present; visible NAP matches the footer. | Keep LocalBusiness schema and matching NAP. |
| RL-FND-04 | understanding | 0/1 | VERIFIED | No dedicated city pages; one service-area list only. | Build one unique city page with local proof. |
| RL-MSR-01 | lead | 2/2 | VERIFIED | GA4 and Google Tag Manager are present. | Keep GA4 and GTM. |
| RL-MSR-02 | lead | 0/2 | VERIFIED | No conversion events or ads tags detected. | Add form and call conversion events. |

## Revenue Opportunities to Investigate

These items require owner or CRM data. They are **not** website failures and did not reduce the score.

**Speed-to-lead** (response) — Response time drives booking rate, and the public site cannot prove it.
  - What is the median time from lead to first human response?
  - How does that change by lead source (call, form, chat, text, ads)?
  - Who owns new leads during business hours and after hours?
  - How many contact attempts are made before a lead is abandoned?
  - How many inbound calls are missed or abandoned each week?

**After-hours and emergency handling** (response) — Emergency demand does not wait for office hours. A visible emergency path is not proof that a human answers it.
  - What happens to a call or form submitted after hours?
  - Is there an on-call rotation or answering service?
  - What percentage of after-hours leads become jobs?
  - Are emergency jobs priced or prioritized differently?

**Lead quality and routing** (qualification) — A form can collect data and still fail to route the right job to the right person.
  - Which form fields are actually used to qualify or route a lead?
  - What percentage of form leads are spam, out of area, or the wrong service?
  - Where do form leads land, and who sees them?
  - What information is missing most often when the office calls back?

**Booking capacity and confirmation** (booking) — An online booking can create a bad customer experience if the calendar is wrong or the office cannot absorb the slot.
  - How many booked jobs are rescheduled or cancelled each week?
  - Is the online calendar connected to real crew capacity?
  - Who confirms appointments, and when?
  - What happens when the requested slot is unavailable?

**Estimate pipeline** (estimate) — Open estimates are often the largest recoverable revenue pool. The website cannot show how many exist.
  - How many estimates are currently open?
  - What is the total value of open estimates?
  - What is the average time from request to estimate delivered?
  - What percentage of estimates are accepted?
  - What percentage of estimate requests never receive an estimate?

**Estimate close rate by source and size** (estimate) — The same website can produce very different revenue depending on close rate, job size, and lead source.
  - What is the close rate by lead source?
  - What is the close rate by job size or service line?
  - What is the average job value?
  - Which objections appear most often on estimates?
  - Which lost reasons are recorded?

**Estimate follow-up** (follow_up) — Open estimates are the fastest recovery pool.
  - What percentage of open estimates receive follow-up?
  - How quickly is the first follow-up made?
  - How many attempts are made before follow-up stops?
  - Which channels are used (call, text, email)?
  - Are estimates segmented by size, service, or age?
  - Are stale estimates reactivated on a schedule?

**Customer history and job completion** (customer) — Repeat and referral revenue depends on knowing who bought, what was installed, and when the next service is due.
  - How many past customers are in the CRM?
  - Is job history, equipment age, and service date recorded?
  - Is there a post-job check-in?
  - How many customers buy a second service within 12 months?

**Review requests** (review) — A strong review profile is public, but the review-request process is not.
  - Are customers automatically asked for a review?
  - How soon after the job is the ask made?
  - Is the ask sent by SMS, email, or in person?
  - Is the process measured by technician or job type?
  - Is negative feedback captured before it becomes a public review?

**Referral operations** (referral) — Referrals are often the lowest-cost lead source, but they are rarely visible on the website.
  - Do you ask for referrals? When and how?
  - Is there a referral offer or tracking method?
  - What percentage of new customers come from referrals?
  - Are referral partners (realtors, property managers, adjacent trades) tracked?
  - Is referral follow-up owned by someone?

**Reactivation and repeat business** (reactivation) — Old leads, unsold estimates, and inactive customers can produce revenue without new ad spend.
  - How many past customers are inactive for 12+ months?
  - How many unsold estimates are older than 30, 60, or 90 days?
  - Are seasonal services or maintenance visits scheduled automatically?
  - Is there a maintenance plan or membership list?
  - Has anyone contacted the inactive list in the last year?

**Marketing attribution and channel profitability** (response) — Tags can show that traffic arrived; only business data can show which channel produces closed revenue.
  - Is lead source recorded on every lead and job?
  - Can you report cost per lead, cost per booked job, and cost per closed job by channel?
  - Do you know revenue by channel?
  - Which campaigns produced jobs in the last 90 days?
  - How much is spent on ads, and what is the return?

## Top fixes

| # | Fix | Checks | Points | Effort |
|---|---|---|---|---|
| 1 | Simplify the mobile estimate form and add input autocomplete | RL-CON-05, RL-CON-06 | +3 | S |
| 2 | Publish a callback promise with a time, channel, and hours | RL-RSP-01 | +2 | S |
| 3 | Add a starting-at price range for the top three jobs | RL-UND-05 | +2 | M |
| 4 | Use one company name and one verifiable differentiator | RL-TRU-06 | +1 | S |
| 5 | Add form and call conversion events | RL-MSR-02 | +2 | S |

The first two fixes are a one-afternoon pass. They recover about 5 points and remove the two highest-friction moments in the lead path.

## What to do next

1. This week: simplify the estimate form and add the callback promise.
2. Next two weeks: publish a starting-at price range and fix the mismatched company name.
3. Before more ad spend: add conversion events and pull the open-estimate list.

## Evidence and limitations

This is a synthetic documentation example. Evidence strings and screenshots are illustrative, not a real business record. A real run stores screenshots, Lighthouse JSON, site-map.json, and paths.json in .audit/<slug>/<run-id>/.

### What this audit cannot determine without owner data

- Actual response time, missed-call rate, or after-hours handling
- Open estimates, estimate follow-up, close rate, or lost reasons
- Customer history, repeat business, referrals, or reactivation
- Lead source, marketing spend, cost per lead, or closed revenue by channel
- Internal booking capacity, confirmation process, or CRM routing

### Non-destructive inspection

No form was submitted, no call placed, no text sent, no appointment booked, no account created, and no payment information entered. A booking control may have been clicked once to detect a scheduler iframe; no appointment was selected.

---

*Synthetic example for documentation. Not a real business. Prepared with Website Scorecard v2.*
