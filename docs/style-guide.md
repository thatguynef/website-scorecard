# Documentation Style Guide

> **For:** anyone writing or reviewing Website Scorecard documentation.

The docs should feel like the product: direct, evidence-based, and calm under pressure. Visual polish supports clarity. It never replaces it.

## Voice

Write for a busy contractor and a skeptical developer at the same time.

- Lead with the answer, then the evidence.
- Prefer short sentences and concrete nouns: "the estimate form", "the booking button", "the mobile phone number".
- Say what was observed. Say what cannot be observed.
- Use "may be leaking", not "is losing".
- Use "owner data required", not "the owner is lying".

### Say

- "local home-service business"
- "booked jobs", "estimates", "service area"
- "observed", "not observed"
- "verified finding", "strong signal", "owner-data question"

### Do not say

- "guaranteed revenue lift"
- "we will fix your site"
- "AI-powered growth engine"
- "dashboard" or "platform" for this repository
- "SEO score" as a synonym for the website score
- "best-in-class", "revolutionary", "unlock"

## Audience

Every top-level doc starts with a one-line audience note:

```markdown
> **For:** owners, marketers, and analysts working with local home-service businesses.
```

Use a developer-specific line for implementation docs:

```markdown
> **For:** developers and auditors who need to inspect, run, or extend the pipeline.
```

Do not repeat the full trade list on every page. Link to [Who this is for](audience.md).

## Colour

The palette is the Radical Red Rocket brand.

| Token | Value | Use |
|---|---|---|
| Ink | `#0B0B0C` | Page and banner background |
| Surface | `#141416` | Panels |
| Card | `#1C1C1F` | Cards and table headers |
| Paper | `#F7F7F5` | Primary text on dark, light-mode background |
| Muted | `#A6A6AA` | Secondary text |
| Line | `rgba(255,255,255,.10)` | Dividers and borders |
| Brand red | `#FF3B3B` | Eyebrows, links, leaks, primary actions |
| Soft red | `#FF8F8F` | Hover and emphasis |
| Green | `#3FBF7F` | Verified and working |
| Amber | `#F5C766` | Strong signal |
| Slate | `#6B6B70` | Owner data, disabled, and footnotes |

Rules:

- Red is both the brand accent and the attention signal. Do not use it for "error" only.
- Never rely on colour alone. Pair every state with a label and a symbol.
- On light backgrounds, use ink text and red accents; do not place muted gray on white below 4.5:1.
- Keep large surfaces near-black in dark mode and off-white in light mode. Avoid pure black and pure white.

## Typography

- **Display:** Space Grotesk, 600–700. Headlines and score numerals only.
- **Body:** Inter, 400–600. Everything else.
- **Labels:** IBM Plex Mono, 400–500, uppercase, letter-spaced 1.2–2.4px. Eyebrows, stages, and metadata.
- Fall back to system UI and monospace stacks. Generated assets must not depend on a webfont being installed.

## Page structure

1. H1.
2. Audience note.
3. One-sentence summary in bold (optional but preferred).
4. Content.
5. A `Next:` footer linking the logical next page.

```markdown
---

**Next:** [Scoring](scoring.md) — how the observable checks become a score out of 100.
```

Use GitHub alerts for the few things a reader must not miss:

```markdown
> [!NOTE]
> Context or a definition.

> [!IMPORTANT]
> A rule that changes how the reader should interpret the output.

> [!WARNING]
> A privacy, safety, or "do not do this" constraint.
```

Do not stack alerts. One per page section at most.

## Tables and lists

- Keep tables to five columns or fewer.
- Bold the decision column, not every cell.
- Put the most important column first.
- Use sentence case in cells, not Title Case.
- Prefer a table for comparisons and a list for sequences.
- Use `<details>` for long command blocks and exhaustive checklists.

## Diagrams

Use a diagram only when it replaces prose or shows a relationship a table cannot.

- **Mermaid** for pipelines and flows that change. GitHub and the docs site render it.
- **SVG** for the signature journey and banner. Keep text as text, not paths.
- Maximum 12 nodes per diagram. Label the edges when direction is ambiguous.
- Include a legend for status colours.
- Every SVG needs `<title>` and `<desc>`.
- Mermaid diagrams need a sentence before or after them explaining the takeaway.

## Images

- Use synthetic or abstract assets only. Never a real client screenshot, logo, or report.
- Store assets in `docs/assets/`.
- SVG for diagrams and marks. PNG for rendered previews and social cards.
- Budgets: SVG ≤ 120 KB, PNG/JPG/WebP ≤ 400 KB, total `docs/assets` ≤ 2 MB.
- Alt text is required for content images; use `alt=""` only for decorative images.
- Design for both GitHub light and dark themes. A dark card with light text is the safest default.
- Compress PNGs before committing. Regenerate the preview with `npm run render:assets`.

## Accessibility

- Contrast at least 4.5:1 for body text and 3:1 for large text.
- Do not encode meaning in colour alone.
- Keep heading levels in order; do not skip from H1 to H3.
- Link text must make sense out of context ("Read the scoring guide", not "click here").
- Tables need header rows.
- Test the docs site at 375px, 768px, and 1440px, in light and dark mode.

## Privacy

- The repository is public.
- No client names, phone numbers, addresses, review text, screenshots, or credentials.
- Do not reference `.audit/`, `audit-screens/`, `reports/`, or `evals/` files in published docs.
- Label every example **synthetic** or **sanitized**.
- Run `npm run check:privacy` and `npm run check:assets` before opening a pull request.

## Conversion and CTAs

The toolkit is free and complete. A CTA is an exit ramp for readers who will not run the commands, not the main path.

- At most one CTA block per page. A single one-line exit link is allowed at the top of `run-an-audit.md`.
- Only use CTAs on [`audience.md`](audience.md), [`run-an-audit.md`](run-an-audit.md), and `README.md`.
- Lead with the free, open-source path. Label the review as optional and separate.
- Link to `https://radicalredrocket.com/scorecard` with UTM parameters:
  - `utm_source=website-scorecard`
  - `utm_medium=docs` or `utm_medium=readme`
  - `utm_campaign=<page-or-placement>`
- State what the form asks for and that it uses public information only.
- Never promise revenue lift, a turnaround, or a specific result.
- No popups, sticky banners, nav items, or CTAs in reference docs.
- Do not imply the CLI is a demo, incomplete, or a lead magnet.

## Review checklist

- [ ] The page states who it is for.
- [ ] The first screen answers the reader's question.
- [ ] The page links the next logical step.
- [ ] Claims are evidence-based and do not promise revenue.
- [ ] Images have alt text and meet the budget.
- [ ] The page works in light and dark mode.
- [ ] Any CTA follows the conversion rules and uses UTM parameters.
- [ ] `npm run check` passes.
- [ ] The docs site builds with `mkdocs build --strict`.
