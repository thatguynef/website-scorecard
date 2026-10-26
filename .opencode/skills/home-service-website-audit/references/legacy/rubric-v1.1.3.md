# Home Service Website Audit - Legacy Rubric (V1)

Version 1.1.3 · 100 points · 42 checks

> **Historical.** This is the legacy 42-check Hormozi rubric. New audits use the
> Revenue Leak Framework in `references/rubric.json`. Historical reports keep V1 scores;
> they are never silently rescored under V2.

Mobile is the primary viewport. Shared checks are scored on the weaker viewport. A7 (Spanish access) is split 3 points mobile / 1 point desktop.

## Categories

| ID | Category | Points |
|---|---|---|
| A | Offer and positioning | 20 |
| B | Conversion path | 20 |
| C | Proof and trust | 15 |
| D | Pricing and offer architecture | 15 |
| E | Mobile experience and speed | 15 |
| F | Local SEO | 10 |
| G | Content and objections | 5 |

## Caps

| Cap | Maximum | Condition |
|---|---|---|
| no_contact | 30 | No phone number or contact path anywhere |
| broken_cta | 50 | Primary CTA broken (404, dead scheduler, form error) |
| mobile_unusable | 60 | Mobile site unusable (menu broken, horizontal scroll on home) |
| no_mobile_offer | 75 | No service/offer clarity above the fold on mobile |
| no_https | 40 | Not HTTPS, or obvious malware/redirect |

## Bands

| Score | Band | Label |
|---|---|---|
| 90+ | A | Elite |
| 75+ | B | Strong |
| 60+ | C | Average |
| 40+ | D | Weak |
| 0+ | F | Critical |

## A. Offer and positioning - 20 points

### A1. Above-fold clarity - 4 points
*Viewports: mobile, desktop · Evidence: M-01, D-01 · Principle: Offer clarity*

- **4** - Service + city + outcome in the first viewport. Score the copy, not the rendering; visual clipping is E2.
- **2** - Service + city, no outcome; or outcome + service, no location.
- **1** - Brand name or slogan only.
- **0** - None of the three.

### A2. One primary offer - 3 points
*Viewports: mobile, desktop · Evidence: Header and hero · Principle: Narrow offer*

- **3** - One dominant CTA, repeated; no more than two secondary header links.
- **2** - Two CTAs of equal visual weight.
- **0** - Three or more equal CTAs, or no CTA.

### A3. Specific offer with a price anchor - 3 points
*Viewports: mobile, desktop · Evidence: Hero, offer section, pricing page · Principle: Price to the buyer*

- **3** - Named offer with a price, starting-at price, or range.
- **2** - Named offer with no price.
- **1** - Free estimate or call-for-quote only.
- **0** - No offer.

### A4. Risk reversal near the CTA - 2 points
*Viewports: site · Evidence: CTA block, offer section · Principle: Risk reversal*

- **2** - Specific guarantee with terms within one scroll of the primary CTA.
- **1** - Generic satisfaction guarantee, or warranty buried in the footer.
- **0** - None.

### A5. Specific differentiation - 2 points
*Viewports: site · Evidence: Hero, why-us section · Principle: Differentiation*

- **2** - Verifiable differentiator in the hero or first scroll.
- **1** - Generic claims only (family owned, best in town, quality service).
- **0** - None.

### A6. Service area and local proof - 2 points
*Viewports: site · Evidence: Hero, footer, contact page · Principle: Local proof*

- **2** - City/radius plus local proof (address, local job photo, local review).
- **1** - City named only.
- **0** - No location signal.

### A7. Spanish-language access - 4 points
*Viewports: mobile, desktop · Evidence: Mobile menu/footer first, then desktop; /es/, hreflang, switcher, notice · Principle: Language access (mobile-weighted 3:1)*

**Mobile (3 points)**
- **3** - Espanol reachable in two taps or fewer; Spanish home, service, and contact/book pages.
- **2** - Spanish home and one conversion page; switcher buried or key pages English-only.
- **1** - Only a 'Se habla espanol' phone note, or one Spanish page with no booking path.
- **0** - No Spanish content, link, or notice.

**Desktop (1 points)**
- **1** - Visible switcher or Spanish page with Spanish conversion content.
- **0** - Absent.


## B. Conversion path - 20 points

### B1. Primary CTA above the fold - 4 points
*Viewports: mobile, desktop · Evidence: M-01, D-01 · Principle: Conversion path*

- **4** - Visible without scrolling on desktop and mobile.
- **2** - Visible on one viewport only.
- **0** - Below the fold on both.

### B2. Click-to-call and text on mobile - 3 points
*Viewports: mobile · Evidence: href scan · Principle: Speed to lead*

- **3** - Working tel: and sms: links in the header or sticky bar.
- **1** - tel: only.
- **0** - Neither; phone as plain text.

### B3. Short form and real-time scheduler - 3 points
*Viewports: site · Evidence: Contact/book page · Principle: Friction*

- **3** - Five fields or fewer and a scheduler with live availability.
- **2** - Five fields or fewer, no scheduler; or a scheduler behind six to eight fields.
- **1** - Nine or more fields.
- **0** - No form and no scheduler.

### B4. Named lead magnet - 2 points
*Viewports: site · Evidence: Hero, offer section · Principle: Narrow lead magnet*

- **2** - Named low-friction offer with its own CTA and section.
- **1** - Free estimate only, no separate section or CTA.
- **0** - None.

### B5. Video / VSL - 2 points
*Viewports: mobile, desktop · Evidence: M-01, D-01 · Principle: VSL pre-sell*

- **2** - 60-second to 7-minute video with a clear play button above the fold or on the offer page.
- **1** - Video buried on the about page, or silent autoplay with no message.
- **0** - No video.

### B6. Financing or payment path - 3 points
*Viewports: site · Evidence: Pricing/financing page · Principle: Payment menu*

- **3** - Named lender + monthly payment example next to the job price + pre-qualification/application link, mobile and desktop.
- **2** - Financing section with terms and an application link, but no monthly payment next to the price.
- **1** - Financing available text only, with no path.
- **0** - None.

### B7. Response-time promise - 2 points
*Viewports: site · Evidence: Form area, contact page · Principle: Speed to lead*

- **2** - Explicit promise (call back in 15 minutes, same-day quote, booked within 24 hours).
- **1** - We will be in touch soon.
- **0** - None.

### B8. Text/chat channel - 1 point
*Viewports: site · Evidence: Widget behavior · Principle: Speed to lead*

- **1** - Working SMS widget or live chat with human handoff.
- **0** - None, or a dead bot that loops.


## C. Proof and trust - 15 points

### C1. Review volume and source - 4 points
*Viewports: site · Evidence: Reviews section, GBP · Principle: Proof stack*

- **4** - Rating, review count, a named external review source (Google, Yelp, Facebook), and a link that opens the review profile; 50+ reviews at 4.5+. A map embed, directions link, or the site’s own reviews page does not count.
- **2** - Rating and count, but under 50 reviews or no external review-platform link. A link to the site’s own reviews page does not count.
- **1** - Three to ten handwritten testimonials, no aggregate.
- **0** - None.

### C2. Specific named testimonials - 3 points
*Viewports: site · Evidence: Reviews page, service pages · Principle: Proof specificity*

- **3** - Three or more with name/photo, job type, and a specific outcome.
- **2** - One or two specific testimonials.
- **1** - Generic quotes only.
- **0** - None.

### C3. Real job photos / before-and-after - 2 points
*Viewports: site · Evidence: Gallery, service pages · Principle: Proof stack*

- **2** - Five or more real job photos with captions or location.
- **1** - Stock photos, or uncaptioned gallery.
- **0** - None.

### C4. License, insurance, certifications - 2 points
*Viewports: site · Evidence: About, footer · Principle: Trust*

- **2** - License number, insurance statement, and certifications visible.
- **1** - One badge or one of the three.
- **0** - None.

### C5. Owner or team face and story - 2 points
*Viewports: site · Evidence: About page · Principle: Trust*

- **2** - Real owner/team photo, name, and a short story.
- **1** - Photo or story, not both.
- **0** - Neither.

### C6. Specific warranty - 2 points
*Viewports: site · Evidence: Offer, service page, footer · Principle: Risk reversal*

- **2** - Workmanship or material warranty with a term and scope for the services sold.
- **1** - The word warranty with no terms for the services sold; a separate home-warranty product does not count.
- **0** - None.


## D. Pricing and offer architecture - 15 points

### D1. Price transparency - 4 points
*Viewports: site · Evidence: Pricing page, service pages · Principle: Price to the buyer*

- **4** - Price list or range for the core services.
- **2** - Starting-at price for one service, or a partial pricing page.
- **1** - Call for pricing only.
- **0** - No pricing signal.

### D2. Tiered packages or VIP - 3 points
*Viewports: site · Evidence: Pricing/offer page · Principle: Anchor and tier*

- **3** - Three service/job packages or standard/VIP with named deliverables for the core job. Maintenance/membership plans belong in D3 and do not count here.
- **2** - Two service tiers.
- **1** - One service package.
- **0** - None.

### D3. Maintenance, membership, or annual plan - 4 points
*Viewports: site · Evidence: Pricing page, home · Principle: Continuity*

- **4** - Plan with price, benefits, and a signup path; a phone call or online form both count.
- **2** - Mentioned with no price or no signup.
- **0** - None.

### D4. Priority, same-day, or prepay option - 2 points
*Viewports: site · Evidence: Pricing, booking page · Principle: Price for speed*

- **2** - Explicit paid priority/same-day option or prepay discount.
- **1** - Same-day mentioned as free availability only.
- **0** - None.

### D5. Financing or fee disclosure - 2 points
*Viewports: site · Evidence: Pricing page · Principle: Payment menu*

- **2** - APR/term/minimum disclosed on the pricing page plus a payment example.
- **1** - Generic 0% claim or processing-fee disclosure only.
- **0** - None.


## E. Mobile experience and speed - 15 points

### E1. Mobile LCP - 4 points
*Viewports: mobile · Evidence: Lighthouse mobile · Principle: Mobile speed*

- **4** - LCP at or under 2.5 seconds.
- **2** - LCP 2.5 to 4.0 seconds.
- **0** - LCP over 4.0 seconds.

### E2. Layout and tap targets - 3 points
*Viewports: mobile · Evidence: M-02, M-03 · Principle: Mobile friction*

- **3** - No horizontal scroll, body text 16px or larger, tap targets 44px or larger.
- **1** - One of the three fails.
- **0** - Two or more fail.

### E3. Sticky call/book bar - 3 points
*Viewports: mobile · Evidence: M-01 to M-04 · Principle: Mobile conversion*

- **3** - Sticky bar with both call and book.
- **1** - One of the two, or a floating button.
- **0** - None.

### E4. Navigation to booking or quote - 2 points
*Viewports: mobile · Evidence: Mobile menu walkthrough · Principle: Mobile conversion*

- **2** - Menu opens and booking or quote request is reachable in two taps or fewer.
- **1** - Three taps.
- **0** - Broken menu or four or more taps.

### E5. No blocking popup - 2 points
*Viewports: mobile · Evidence: M-01 · Principle: Mobile friction*

- **2** - No popup in the first 30 seconds, or a dismissible one that does not cover the CTA.
- **1** - Popup appears but is easy to dismiss.
- **0** - Blocking overlay on load or exit-intent that covers the CTA.

### E6. Form usability - 1 point
*Viewports: mobile · Evidence: Form inspection · Principle: Mobile friction*

- **1** - Correct input types, autocomplete, no zoom on focus, submit reachable.
- **0** - Any of those fail.


## F. Local SEO - 10 points

### F1. Title and meta - 2 points
*Viewports: site · Evidence: Page source / SERP preview · Principle: Local search*

- **2** - Title contains the primary service and city; meta description is written.
- **1** - One of the two.
- **0** - Neither.

### F2. H1 - 2 points
*Viewports: site · Evidence: Page source · Principle: Local search*

- **2** - One H1 with service and city.
- **1** - One of them.
- **0** - No H1 or a logo-only H1.

### F3. NAP and map - 2 points
*Viewports: site · Evidence: Contact page, footer · Principle: Local trust*

- **2** - Consistent name, address, phone plus an embedded map.
- **1** - Phone and city only.
- **0** - None.

### F4. City/service-area pages - 2 points
*Viewports: site · Evidence: Sitemap or nav · Principle: Local search*

- **2** - Three or more dedicated city pages with unique content (verified, not just linked).
- **1** - One service-area page listing cities, or city links without verified unique content.
- **0** - None.

### F5. Structured data - 1 point
*Viewports: site · Evidence: Schema checker · Principle: Local search*

- **1** - LocalBusiness, Service, or FAQ schema detected.
- **0** - None.

### F6. Google Business Profile link - 1 point
*Viewports: site · Evidence: Footer, reviews section · Principle: Local search*

- **1** - Site links to the Google Business Profile or review profile.
- **0** - No link.


## G. Content and objections - 5 points

### G1. Service page answers four buying questions - 2 points
*Viewports: site · Evidence: Primary service page · Principle: Objection handling*

- **2** - Price, time/process, warranty, and next step all answered.
- **1** - Two or three answered.
- **0** - Zero or one.

### G2. FAQ with real objections - 1 point
*Viewports: site · Evidence: FAQ section · Principle: Objection handling*

- **1** - Five or more questions covering price, timing, damage, warranty, financing.
- **0** - None or generic.

### G3. Advice content freshness - 1 point
*Viewports: site · Evidence: Blog/resources · Principle: Content*

- **1** - At least one post or guide in the last 90 days, or an evergreen guide.
- **0** - Stale or none.

### G4. Next step at end of content - 1 point
*Viewports: site · Evidence: End of page · Principle: Conversion*

- **1** - CTA at the end of service/advice content.
- **0** - None.
