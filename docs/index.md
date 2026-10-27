---
hide:
  - navigation
  - toc
---

<section class="ws-hero">
  <div class="ws-hero__copy">
    <p class="ws-eyebrow">FOR LOCAL HOME-SERVICE BUSINESSES</p>
    <h1>Find where your website leaks booked jobs.</h1>
    <p class="ws-lede">Website Scorecard scores what the public site can prove, separates verified leaks from owner-data questions, and produces a contractor-facing report in one run.</p>
    <div class="ws-actions">
      <a class="ws-btn ws-btn--primary" href="audience/">Who it's for</a>
      <a class="ws-btn" href="revenue-leak-framework/">See the framework</a>
    </div>
    <p class="ws-trades">Plumbing · HVAC · Roofing · Electrical · Pest control · Garage door · Landscaping · Restoration · Cleaning</p>
  </div>
  <figure class="ws-hero__media">
    <picture>
      <source media="(max-width: 60em)" srcset="assets/scorecard-preview-640.png">
      <img src="assets/scorecard-preview.png" alt="Synthetic sample report for Acme Plumbing showing 68 out of 100, three revenue leaks, and a score breakdown" width="1200" height="1000" fetchpriority="high">
    </picture>
    <figcaption>Synthetic sample report</figcaption>
  </figure>
</section>

## What you get

<div class="grid cards ws-cards-4" markdown>

-   :material-gauge:{ .lg .middle } **A score you can defend**

    ---

    A 0–100 score across seven weighted categories. N/A checks leave the denominator, so the score never inflates.

-   :material-file-document-outline:{ .lg .middle } **A report a contractor will read**

    ---

    Three leaks, the evidence behind each, the fix, and the questions only the owner can answer.

-   :material-magnify-scan:{ .lg .middle } **Evidence states, not opinions**

    ---

    VERIFIED, STRONG SIGNAL, OWNER DATA REQUIRED, or NOT APPLICABLE. Every finding is labeled.

-   :material-database-outline:{ .lg .middle } **Machine-readable output**

    ---

    `scores.json`, a coverage matrix, and a verification gate for downstream tools.

</div>

## How it works

```mermaid
flowchart LR
  A[Collect] --> B[Review] --> C[Score] --> D[Render] --> E[Verify]
```

Collection is deterministic. Only judgment checks use a model. Scoring, rendering, and verification are file-based and reproducible. Read the [architecture](architecture.md) if you want the details.

## Start here

<div class="grid cards" markdown>

-   **I own or market a home-service business**

    ---

    Start with [who this is for](audience.md) and [why this exists](methodology.md).

-   **I want to run an audit**

    ---

    Enter the website URL, fill the judgment checks, and render the report. See [Run an audit](run-an-audit.md).

-   **I want to extend the rubric**

    ---

    Read the [architecture](architecture.md) before adding a check.

</div>

## Public by design

> [!NOTE]
> Every public example is synthetic or sanitized. The repository never ships real client screenshots, reports, or customer data. The Scorecard diagnoses; remediation is a separate system.

Website Scorecard is maintained alongside [Radical Red Rocket](https://radicalredrocket.com), which uses it as the diagnostic framework behind live Revenue Leak Teardowns.
