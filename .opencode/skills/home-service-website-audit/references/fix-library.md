# Fix Library — Problem → Stage → Why → Fix → Metric

Use this when writing recommendations. Every fix should name the stage, the observable problem, the business consequence, the change, and the metric to watch. Avoid "improve engagement" or "optimize the funnel."

## 1. Understand

### Service clarity is low (`RL-UND-01`)
- **Problem:** The first viewport does not say what the business does in plain language.
- **Why:** A visitor who has to decode the page leaves before becoming a lead.
- **Fix:** Put the service, city, and outcome in the hero: `[Outcome] in [City] — [specific offer]`.
- **Metric:** Mobile bounce rate on the home page; scroll depth past the hero.

### Location is unclear (`RL-UND-02`, `RL-UND-07`)
- **Problem:** A visitor cannot tell whether their city is served.
- **Why:** Out-of-area leads waste office time; in-area leads may assume the business is too far away.
- **Fix:** Add a service-area page, a city/radius statement, and a ZIP or city check.
- **Metric:** Out-of-area lead rate; qualified lead rate by city.

### Outcome or customer is vague (`RL-UND-03`)
- **Problem:** The copy describes the company, not the customer's problem or result.
- **Why:** The visitor cannot see themselves in the offer.
- **Fix:** Add a problem/outcome block: "Water heater leaking? We repair or replace it today."
- **Metric:** Hero CTA click-through rate.

### The next step is unclear (`RL-UND-04`)
- **Problem:** Multiple actions compete, or the primary action is below the fold.
- **Why:** Choice paralysis and extra scrolling reduce conversion.
- **Fix:** One primary action (`Get an estimate`), one secondary (`Call`), repeated after proof.
- **Metric:** Primary CTA clicks per session.

### No price anchor (`RL-UND-05`)
- **Problem:** The offer has no price, starting-at price, or range.
- **Why:** The visitor cannot judge affordability and may leave to compare.
- **Fix:** Publish a range for the three most-requested jobs, or a starting-at price for one offer.
- **Metric:** Estimate requests from service pages.

### Service navigation is deep (`RL-UND-06`)
- **Problem:** High-intent visitors cannot reach a relevant service page quickly.
- **Why:** Search traffic lands on the wrong page and leaves.
- **Fix:** Put the top services in the main menu and link them from the home page.
- **Metric:** Service-page sessions and conversion rate.

## 2. Lead / Contact

### Phone is hidden or inconsistent (`RL-CON-01`)
- **Problem:** The number is buried, or different numbers appear on different pages.
- **Why:** A ready caller cannot act or loses confidence.
- **Fix:** Put one number in the header, hero, contact page, and footer.
- **Metric:** Click-to-call rate; call volume by page.

### Phone is not tappable (`RL-CON-02`)
- **Problem:** The number is plain text on mobile.
- **Why:** Copying a number on a phone adds friction and loses callers.
- **Fix:** Use a `tel:` link in the header or a sticky action bar.
- **Metric:** Mobile click-to-call rate.

### Form has too much friction (`RL-CON-05`, `RL-CON-06`)
- **Problem:** Too many fields, unnecessary required data, missing labels, no autocomplete, or a submit button that is hard to reach.
- **Why:** Every extra field lowers completion, especially on a phone.
- **Fix:** Cut to name, phone, ZIP, and problem; add labels, correct input types, and autocomplete.
- **Metric:** Form start-to-submit rate; mobile form completion.

### No scheduler or booking path (`RL-CON-07`)
- **Problem:** The visitor can only call or fill a form.
- **Why:** After-hours and busy-signal demand goes to a competitor.
- **Fix:** Add a working scheduler with real availability, reachable in two taps.
- **Metric:** Booked appointments; after-hours bookings.

### Conversion dead end (`RL-CON-08`)
- **Problem:** A high-intent page ends with no next step.
- **Why:** The visitor has to go back to the menu to act.
- **Fix:** End every service, about, and advice page with the primary CTA.
- **Metric:** Exit rate on high-intent pages; CTA clicks from page end.

### No alternate channel (`RL-CON-09`)
- **Problem:** No visible chat, callback, or text option when enabled for the market.
- **Why:** Some visitors will not call or fill a form.
- **Fix:** Add a human-backed callback request or SMS path; do not add a dead bot.
- **Metric:** Leads by channel; callback completion.

## 3. Response / Qualification / Booking

### No response expectation (`RL-RSP-01`)
- **Problem:** The form gives no time, channel, or hours for a response.
- **Why:** The visitor cannot tell whether anyone saw the request.
- **Fix:** Add a specific promise beside the CTA: "We call or text within 15 minutes during office hours."
- **Metric:** Time to first response; lead-to-booking rate.

### No after-hours path (`RL-RSP-02`)
- **Problem:** Hours or an emergency path are missing, or they are disconnected.
- **Why:** Urgent demand does not wait for office hours.
- **Fix:** State hours and what happens after hours; connect the emergency call path.
- **Metric:** After-hours leads; after-hours booking rate.

### Booking path has too many steps (`RL-RSP-03`)
- **Problem:** Book/quote takes too many taps, requires an account, or transitions confusingly to a third party.
- **Why:** Each step loses ready-to-buy visitors.
- **Fix:** Keep the scheduler on-site, reduce steps, and show availability immediately.
- **Metric:** Booking start-to-complete rate; drop-off by step.

### No confirmation expectation (`RL-RSP-04`)
- **Problem:** The page does not say what happens after submission.
- **Why:** Uncertainty creates duplicate calls and cancellations.
- **Fix:** State the confirmation channel and timing.
- **Metric:** Duplicate inquiries; appointment show rate.

### Lead flow asks too little or too much (`RL-RSP-05`)
- **Problem:** The form cannot route the job, or it demands irrelevant detail before a human responds.
- **Why:** Bad routing wastes office time; excessive friction loses leads.
- **Fix:** Capture service, ZIP/area, problem, and contact preference. Make everything else optional.
- **Metric:** Qualified-lead rate; time to route.

### No estimate workflow (`RL-RSP-06`)
- **Problem:** The visitor cannot request an estimate with enough scope for a useful response.
- **Why:** High-value jobs require a next step that the site does not provide.
- **Fix:** Add an estimate request with scope fields, photo upload, and a clear next step.
- **Metric:** Estimate requests; estimate-to-job rate.

## 4. Trust

### Reviews are weak or unlinked (`RL-TRU-01`)
- **Problem:** No rating, count, source, or external profile link.
- **Why:** The buyer cannot verify the business's reputation.
- **Fix:** Show the Google rating and count, and link the profile. If under 50 reviews, fix the review engine before buying more traffic.
- **Metric:** Conversion rate by review count; branded search.

### Testimonials are generic (`RL-TRU-02`)
- **Problem:** Quotes have no name, job, or outcome.
- **Why:** Generic praise does not reduce risk.
- **Fix:** Add three named stories with job type and one specific result.
- **Metric:** Service-page conversion rate.

### No real project proof (`RL-TRU-03`)
- **Problem:** Stock photos or an uncaptioned gallery.
- **Why:** The buyer cannot picture the work.
- **Fix:** Caption real jobs with city, service, and result.
- **Metric:** Gallery engagement; estimate requests from project pages.

### License or insurance is absent (`RL-TRU-04`)
- **Problem:** No visible license, insurance, bond, or certification where relevant.
- **Why:** The buyer cannot judge legitimacy.
- **Fix:** Add the license number, insurance statement, and relevant certification. Do not invent claims.
- **Metric:** Quote requests from high-intent pages.

### Warranty is vague (`RL-TRU-05`)
- **Problem:** The word warranty appears with no term or scope.
- **Why:** The buyer cannot weigh the risk.
- **Fix:** State the workmanship or material warranty term and scope near the buying path.
- **Metric:** Estimate acceptance rate.

### Identity is generic or inconsistent (`RL-TRU-06`)
- **Problem:** No real owner/team identity, or the company name changes across pages.
- **Why:** The business feels anonymous or untrustworthy.
- **Fix:** Use one company name, one real identity, and one verifiable differentiator consistently.
- **Metric:** Branded search; direct traffic.

## 5. Mobile / Technical

### Slow mobile page (`RL-MOB-01`)
- **Problem:** Median mobile LCP is over 2.5 seconds.
- **Why:** Slow pages lose visitors before the offer renders.
- **Fix:** Compress/resize hero images, defer non-critical scripts, remove render-blocking fonts and third-party tags.
- **Metric:** Mobile LCP; mobile conversion rate.

### Mobile layout fails (`RL-MOB-02`)
- **Problem:** Horizontal overflow, tiny text, clipped headings, or a broken menu.
- **Why:** The visitor cannot read the offer or complete the action.
- **Fix:** Fix the viewport, set body text to 16px+, and test at 390px.
- **Metric:** Mobile bounce; form completion.

### Action is hard to reach (`RL-MOB-03`)
- **Problem:** Small tap targets or a primary action that requires scrolling back to the top.
- **Why:** The visitor gives up before calling or booking.
- **Fix:** Use 44px targets and a persistent call/book action.
- **Metric:** Mobile CTA clicks.

### HTTPS or security failure (`RL-MOB-04`)
- **Problem:** HTTP, certificate failure, or an unrelated redirect.
- **Why:** Browsers warn the visitor away, and trust collapses.
- **Fix:** Serve HTTPS, fix the certificate, and remove the redirect.
- **Metric:** Browser warnings; organic sessions.

### Broken conversion path (`RL-MOB-05`)
- **Problem:** A CTA, form, scheduler, or key service link is broken.
- **Why:** The primary path ends in a dead end.
- **Fix:** Fix the link or form and add a regression check.
- **Metric:** Error rate; conversion rate by path.

## 6. Findability

### Weak title/meta/H1 (`RL-FND-01`)
- **Problem:** The search snippet and H1 do not combine service and city.
- **Why:** The right local buyer cannot tell the page is relevant.
- **Fix:** `[Service] in [City] | [Brand]`; H1 `[Service] in [City] — [outcome]`.
- **Metric:** Impressions and CTR for local service queries.

### Indexing blocker (`RL-FND-02`)
- **Problem:** Noindex, robots block, missing canonical, or no sitemap.
- **Why:** Useful pages cannot be discovered.
- **Fix:** Fix robots/noindex, add a canonical, and submit a sitemap.
- **Metric:** Indexed pages; organic sessions.

### Weak local entity signal (`RL-FND-03`)
- **Problem:** No LocalBusiness/Service schema or inconsistent NAP.
- **Why:** Search engines and buyers get conflicting local signals.
- **Fix:** Add schema and make the visible NAP consistent.
- **Metric:** Local pack visibility; branded search.

### Thin service/location content (`RL-FND-04`)
- **Problem:** Only a list of cities or duplicated pages.
- **Why:** The page does not answer a local buyer's question.
- **Fix:** Build one unique city page with local jobs, reviews, and an offer.
- **Metric:** Organic sessions and leads by location page.

## 7. Measurement

### No analytics (`RL-MSR-01`)
- **Problem:** No GA4, GTM, or equivalent.
- **Why:** The business cannot see which pages and channels create leads.
- **Fix:** Install one analytics platform and document ownership.
- **Metric:** Traffic and conversion coverage.

### No conversion or paid-traffic measurement (`RL-MSR-02`)
- **Problem:** No conversion events, call tracking, or ads tags.
- **Why:** The business cannot attribute leads or judge ad spend.
- **Fix:** Add form and call conversion events; connect them to the CRM.
- **Metric:** Cost per lead, booked job, and closed job by channel.

## Owner-data opportunities (not fixes to the website)

Use the question library in `references/rubric.json` under `ownerData` for:

- Speed-to-lead and missed calls
- After-hours handling
- Lead quality and routing
- Booking capacity and confirmation
- Open estimates and estimate turnaround
- Estimate follow-up and close rate
- Customer history and repeat business
- Review requests
- Referral operations
- Reactivation
- Marketing attribution

Each opportunity should end with a measurement question, not a website recommendation.
