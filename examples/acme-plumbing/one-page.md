# Website Scorecard — Acme Plumbing (synthetic)

**https://acme-plumbing.example/** · Plumbing · Example County, CA · **October 26, 2026**

# 68 / 100 — Average

**A credible plumbing site with a working booking path, but the estimate form and response expectations leak ready-to-buy jobs.**

---

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

---

## Customer Journey

| Stage | Status | What we observed |
|---|---|---|
| Understanding | Scored | Service and city are clear; price and outcome language are weak. |
| Lead | Scored | Phone, form, and scheduler work; form friction is the main leak. |
| Response | Scored + owner data | Hours and emergency path visible; no response-time promise. Actual speed needs owner data. |
| Booking | Scored + owner data | Scheduler works; capacity and confirmation need owner data. |
| Estimate | Scored + owner data | Request path exists; open estimates and close rate need owner data. |
| Follow-up | Owner data required | Not observable from the public site. |
| Review | Scored + owner data | 38 reviews and a profile link are visible; request process needs owner data. |

---

## Score breakdown

| Area | Score |
|---|---|
| Understand | 14.4 / 20 |
| Contact | 18.7 / 22 |
| Respond and Book | 11.0 / 16 |
| Trust | 9.0 / 15 |
| Mobile and Technical | 8.0 / 15 |
| Findability | 5.0 / 8 |
| Measurement | 2.0 / 4 |
| **Total** | **68 / 100** |

---

## What is already working

- Phone and click-to-call are consistent on mobile, including a sticky action.
- A working scheduler shows live availability and is two taps from the home page.
- License, insurance, and a manufacturer certification are visible.

---

## Top fixes

| # | Fix | Checks | Points | Effort |
|---|---|---|---|---|
| 1 | Simplify the mobile estimate form and add input autocomplete | RL-CON-05, RL-CON-06 | +3 | S |
| 2 | Publish a callback promise with a time, channel, and hours | RL-RSP-01 | +2 | S |
| 3 | Add a starting-at price range for the top three jobs | RL-UND-05 | +2 | M |
| 4 | Use one company name and one verifiable differentiator | RL-TRU-06 | +1 | S |
| 5 | Add form and call conversion events | RL-MSR-02 | +2 | S |

The first two fixes are a one-afternoon pass. They recover about 5 points and remove the two highest-friction moments in the lead path.

---

## Revenue Opportunities to Investigate

**Speed-to-lead** (Response) — Response time drives booking rate, and the public site cannot prove it.
  - What is the median lead-to-response time?

**Estimate follow-up** (Follow-up) — Open estimates are the fastest recovery pool.
  - How many estimates are open, and what is their value?

**Reactivation** (Reactivation) — Past customers can produce jobs without new ad spend.
  - How many customers are inactive for 12+ months?

---

## What to do next

1. This week: simplify the estimate form and add the callback promise.
2. Next two weeks: publish a starting-at price range and fix the mismatched company name.
3. Before more ad spend: add conversion events and pull the open-estimate list.

---

*Synthetic example for documentation. Not a real business. Prepared with Website Scorecard v2. · [Full audit](full-report.md) · Rubric v2.0.0 · Collector v2.0.0 · Scorer v2.0.0 · Run 2026-10-26T1000*
