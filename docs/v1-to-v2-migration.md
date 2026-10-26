# V1 → V2 Migration

V1 is the legacy 42-check Hormozi rubric (`1.x`). V2 is the Revenue Leak Framework (`2.x`). The change is not a renaming exercise; the scoring model, applicability, evidence states, and report structure changed.

**Historical reports keep their V1 version.** They are not silently rescored. A V2 re-audit gets a new run ID.

## Why the score is not comparable

| V1 | V2 |
|---|---|
| 42 fixed checks, all scored | 40 checks with required/recommended/conditional applicability |
| Spanish 4 points hardcoded | Language is a configurable module |
| Financing, VSL, tiers, membership, paid priority, content freshness scored universally | Optional opportunity modules, not universal penalties |
| No N/A | N/A checks removed from the denominator; category weights normalized |
| Direct point sum | Applicability-aware category normalization |
| 7 categories: offer, conversion, proof, pricing, mobile, SEO, content | 7 categories: understand, contact, respond/book, trust, mobile/technical, findability, measurement |
| No explicit owner-data separation | Owner-data library never affects the score |
| One evidence state in practice | VERIFIED / STRONG SIGNAL / OWNER DATA REQUIRED / NOT APPLICABLE |

A V1 36 and a V2 68 describe the same kind of site on different rulers. Do not put them in the same trend line without a version note.

## Migration matrix

| Current ID | Current check | V2 destination | Decision | Reason |
|---|---|---|---|---|
| A1 | Above-fold clarity | `RL-UND-01` Service clarity; `RL-UND-03` Outcome clarity | Modify | Split "service" from "problem/outcome" so each can be judged specifically. |
| A2 | One primary offer | `RL-UND-04` Primary action clarity | Modify | Focus on the visitor's next step, not a single "offer" construct. |
| A3 | Specific offer with a price anchor | `RL-UND-05` Offer specificity and price anchor | Modify | Reduce from 3 to 2 points; full pricing transparency becomes an optional module. |
| A4 | Risk reversal near the CTA | `RL-TRU-05` Guarantee and warranty specificity | Keep/modify | Move to Trust, where risk reversal belongs. |
| A5 | Specific differentiation | `RL-TRU-06` Identity and differentiation consistency | Modify | Combine with owner/team identity and cross-page consistency. |
| A6 | Service area and local proof | `RL-UND-02` Location and service-area clarity | Keep/modify | Raise to 3 points; explicit eligibility. |
| A7 | Spanish-language access | `RL-UND-08` Language access | Conditional | Configurable preferred languages; N/A when not relevant. |
| B1 | Primary CTA above the fold | `RL-UND-04` Primary action clarity | Merge | CTA placement and clarity are one decision. |
| B2 | Click-to-call and text on mobile | `RL-CON-01` Phone visible; `RL-CON-02` Click-to-call; `RL-CON-03` SMS | Split | Phone visibility, tel: implementation, and SMS are different leaks. SMS is conditional. |
| B3 | Short form and real-time scheduler | `RL-CON-04` Form exists; `RL-CON-05` Form friction; `RL-CON-06` Form usability; `RL-CON-07` Scheduler; `RL-RSP-05` Qualification context | Split | One check was measuring four different problems. |
| B4 | Named lead magnet | Optional `lead_magnet` module | Opportunity | Not universal; report it as an opportunity when relevant. |
| B5 | Video / VSL | Optional `video` module | Opportunity | Valuable for some offers, irrelevant for many local trades. |
| B6 | Financing or payment path | Optional `financing` module | Conditional/opportunity | High-ticket relevance only; no universal penalty. |
| B7 | Response-time promise | `RL-RSP-01` Response and acknowledgement promise | Modify | Separate the observable promise from actual response time (owner data). |
| B8 | Text/chat channel | `RL-CON-03` SMS; `RL-CON-09` Chat/callback | Conditional | Split; both are optional and not universal. |
| C1 | Review volume and source | `RL-TRU-01` Review volume, source, profile link | Keep/modify | Raise to 4 points; external profile link matters. |
| C2 | Specific named testimonials | `RL-TRU-02` Specific testimonials and case studies | Keep | Still the proof-specificity check. |
| C3 | Real job photos / before-after | `RL-TRU-03` Real project proof | Keep | Add job context and captions. |
| C4 | License, insurance, certifications | `RL-TRU-04` License, insurance, certifications | Conditional | Relevant in most licensed trades, but configurable. |
| C5 | Owner/team face and story | `RL-TRU-06` Identity and differentiation | Merge | Identity and differentiation are one trust decision. |
| C6 | Specific warranty | `RL-TRU-05` Guarantee and warranty specificity | Merge | Same risk-reversal concept as A4. |
| D1 | Price transparency | `RL-UND-05` (light anchor); optional `pricing_transparency` | Reduce/opportunity | A full price list is not universally appropriate; a light anchor still helps. |
| D2 | Tiered packages or VIP | Optional `tiered_packages` | Opportunity | A revenue architecture choice, not a website failure. |
| D3 | Maintenance/membership plan | Optional `membership` | Opportunity | Continuity is valuable for recurring trades; not universal. |
| D4 | Priority/same-day/prepay | Optional `priority_service` | Opportunity | A pricing strategy, not a universal conversion requirement. |
| D5 | Financing/fee disclosure | Optional `financing` | Conditional/opportunity | Only relevant when financing is offered. |
| E1 | Mobile LCP | `RL-MOB-01` Mobile LCP | Keep | Same 4-point speed check, median of 3 runs. |
| E2 | Layout and tap targets | `RL-MOB-02` Mobile layout; `RL-MOB-03` Tap targets/persistent action | Split | Layout usability and action reachability are different failures. |
| E3 | Sticky call/book bar | `RL-MOB-03` Tap targets and persistent action | Modify | A persistent action is useful; a specific sticky-bar design is not mandatory. |
| E4 | Navigation to booking/quote | `RL-RSP-03` Booking steps and mobile usability | Modify | Measure the actual path, not just the menu. |
| E5 | No blocking popup | `RL-MOB-02` Mobile layout usability | Merge | A blocking overlay is a mobile layout failure. |
| E6 | Form usability | `RL-CON-06` Form usability | Keep | Labels, input types, autocomplete, submit reachability. |
| F1 | Title and meta | `RL-FND-01` Title, meta, H1 | Merge | Title, meta, and H1 are one search-snippet decision. |
| F2 | H1 | `RL-FND-01` Title, meta, H1 | Merge | Same. |
| F3 | NAP and map | `RL-FND-03` Local schema and NAP consistency | Modify | Add schema consistency; map is optional evidence. |
| F4 | City/service-area pages | `RL-FND-04` Service/location pages; `RL-UND-07` Eligibility navigation | Split | Local content depth and eligibility navigation are different. |
| F5 | Structured data | `RL-FND-03` Local schema and NAP consistency | Merge | LocalBusiness/Service schema is part of the entity signal. |
| F6 | Google Business Profile link | `RL-TRU-01` Review volume/source/profile link | Merge | The profile link belongs with review proof. |
| G1 | Service page answers four buying questions | `RL-RSP-05` Qualification context; `RL-RSP-06` Estimate workflow | Modify | Separate routing context from estimate path. |
| G2 | FAQ with real objections | `RL-RSP-05` Qualification context | Merge | FAQ content supports routing and objection handling; not a separate universal score. |
| G3 | Advice content freshness | Optional `content_freshness` | Opportunity | Not a universal revenue-leak penalty. |
| G4 | Next step at end of content | `RL-CON-08` No conversion dead end | Modify | Generalize from content pages to all high-intent pages. |

## New V2 checks

| Check | Why it was added |
|---|---|
| `RL-UND-06` Service navigation | High-intent visitors must reach a relevant service page quickly. |
| `RL-UND-07` Service-area eligibility navigation | Out-of-area leads and eligibility confusion are a real leak. |
| `RL-UND-08` Language access | Preserves the old Spanish insight without hardcoding one language. |
| `RL-CON-01` Phone visible and consistent | The old rubric assumed a phone existed; consistency was not checked. |
| `RL-CON-05` Form friction | Pulled out of a combined form/scheduler check. |
| `RL-CON-08` Conversion dead end | Every high-intent page needs a next step. |
| `RL-CON-09` Chat/callback | Optional alternate channel. |
| `RL-RSP-02` After-hours/emergency path | Emergency trades need a visible path. |
| `RL-RSP-04` Confirmation expectations | The visitor needs to know what happens after submission. |
| `RL-RSP-06` Estimate workflow | Estimate requests are a major revenue path. |
| `RL-FND-02` Indexability | Canonical, robots, and sitemap were not explicitly scored. |
| `RL-MOB-04` HTTPS/security | A baseline cap-worthy failure. |
| `RL-MOB-05` Broken links/CTAs/JS errors | Technical failures that block conversion. |
| `RL-MSR-01` Analytics | Can the business measure anything? |
| `RL-MSR-02` Conversion/paid measurement | Can the business attribute leads? |

## Removed as universal scored checks

These remain useful as opportunity flags or owner-data prompts, but they no longer affect every site's 100-point score:

- VSL/video
- Full price transparency
- Tiered packages / VIP
- Membership / maintenance plan
- Paid priority / same-day
- Financing / fee disclosure
- Named lead magnet
- Content freshness
- A specific sticky-bar design (replaced by a persistent-action outcome)
- Universal Spanish access (replaced by configurable language access)
- Universal SMS/chat (replaced by conditional modules)

## Report migration

V1 report:

- Executive summary
- Score card
- Top five fixes
- Detailed 42-row findings
- Copy pack
- 30/60/90 plan
- What we could not assess
- Evidence appendix

V2 report:

- One-sentence verdict
- The three biggest revenue leaks with evidence, why, fix, and confidence
- Customer journey summary
- Score breakdown
- Website findings (all checks)
- Revenue opportunities to investigate (owner data)
- Recommended next steps
- Evidence and limitations

The V2 report is simpler at the top and more rigorous underneath. The three biggest leaks are not necessarily the three lowest-scoring checks; they are ranked by likely economic impact and confidence.

## Running the two versions

```sh
# V2 (default)
python3 .opencode/skills/home-service-website-audit/scripts/score.py \
  --input audit.filled.json --out scores.json --strict

# V1 historical
python3 .opencode/skills/home-service-website-audit/scripts/score.py \
  --input examples/legacy-v1-roofing/audit.filled.json \
  --rubric .opencode/skills/home-service-website-audit/references/legacy/rubric-v1.1.3.json \
  --out scores.json --strict
```

Do not overwrite a delivered V1 report with a V2 score. Create a new V2 run and explain the change.
