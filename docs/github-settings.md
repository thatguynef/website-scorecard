# Recommended GitHub Repository Settings

These settings are recommendations for the repository owner. They are not applied automatically by the codebase.

## Description

Use:

> Evidence-based website scorecard for local home-service businesses: find conversion and revenue leaks in plumbing, HVAC, roofing, electrical, and similar trades.

## Website

Use the deployed documentation site:

- `https://thatguynef.github.io/website-scorecard/` once the `Docs` workflow has deployed
- Until then, `https://radicalredrocket.com`

Do not point the repository website at a private client workspace.

## Topics

```text
website-audit
conversion-rate-optimization
local-business
home-services
contractors
plumbing
hvac
roofing
lead-generation
revenue-operations
lighthouse
marketing-automation
website-scorecard
open-source
```

## Related scorecards

- [Website Scorecard](https://thatguynef.github.io/website-scorecard/)
- [Local Visibility Scorecard](https://thatguynef.github.io/local-visibility-scorecard/)
- [GBP Scorecard](https://thatguynef.github.io/gbp-scorecard/)

## Social preview

Upload `docs/assets/social-preview.png` (1200×630, under 1 MB). It should read:

> Website Scorecard — find where local home-service websites leak customers and revenue.

## Brand

The project uses the Radical Red Rocket palette:

| Token | Value | Use |
|---|---|---|
| Ink | `#0B0B0C` | Page and banner background |
| Surface | `#141416` | Panels |
| Card | `#1C1C1F` | Cards and tables |
| Paper | `#F7F7F5` | Primary text on dark, light-mode background |
| Muted | `#A6A6AA` | Secondary text |
| Brand red | `#FF3B3B` | Eyebrows, links, leaks, primary actions |
| Soft red | `#FF8F8F` | Hover and emphasis |
| Green | `#3FBF7F` | Verified/working |
| Amber | `#F5C766` | Strong signal |

Typography: Space Grotesk (display), Inter (body), IBM Plex Mono (labels). Never rely on colour alone; pair every state with a label and symbol.

## Other settings

- Enable **private vulnerability reporting** so `SECURITY.md` has a private channel.
- Enable **Discussions** if you want methodology questions separated from issues.
- Require CI to pass before merging to `main`.
- Protect `main` from force-pushes after the history cleanup is complete.
- Keep **Issues** public, but ask reporters not to include client data, credentials, or customer PII.
- If the history is rewritten to remove earlier client artifacts, coordinate a force-push and tell collaborators to re-clone.
- Enable **GitHub Pages** with source **GitHub Actions** so `.github/workflows/docs.yml` can deploy.

## What not to do

- Do not describe the project as a hosted SaaS or a guarantee of revenue lift.
- Do not publish real client reports as "case studies" without written permission.
- Do not add a license badge that does not match `LICENSE`.
- Do not claim GitHub settings were changed unless they were.
