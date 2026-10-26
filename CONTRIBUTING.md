# Contributing

Thanks for improving the Website Revenue Leak Scorecard. The project is deliberately small: structured files, deterministic scripts, and tests. Please keep it that way.

## Before you start

- Read [`docs/methodology.md`](docs/methodology.md) and [`docs/evidence.md`](docs/evidence.md).
- Read [`docs/development.md`](docs/development.md) for setup and test commands.
- Check the issue tracker for an existing discussion.
- Do not add real client data, screenshots, credentials, or private business information.

## Local setup

```sh
git clone https://github.com/thatguynef/website-scorecard.git
cd website-scorecard
npm run doctor
npm test
```

Requirements: Node.js 22+, Python 3.10+, and Chrome/Chromium. Lighthouse is optional for development.

## What makes a good contribution

A check should answer at least one of:

- Can this cost the business a lead?
- Can this prevent a booking?
- Can this weaken trust?
- Can this waste traffic?
- Can this hide a revenue opportunity?
- Can this prevent measurement?

Do not add checks just to increase the count. Prefer a smaller number of high-value checks with clear evidence.

## Add a check

1. Edit `.opencode/skills/home-service-website-audit/references/rubric.json`.
2. Add an ID (`RL-XXX-00`), category, weight, allowed scores, anchors, journey stage, evidence type, evaluation type, applicability, severity, and service mapping.
3. Add it to a journey stage or supporting system.
4. If it is optional, add it to `optionalModules` and document the configuration.
5. Add the deterministic auto score in `collect.mjs` if applicable; otherwise leave it for model judgment.
6. Regenerate:
   ```sh
   python3 .opencode/skills/home-service-website-audit/scripts/render_rubric.py
   python3 .opencode/skills/home-service-website-audit/scripts/render_coverage.py
   python3 .opencode/skills/home-service-website-audit/scripts/render_portable.py
   ```
7. Add a test in `test_score.py`. If it affects a cap or invariant, add a mutation in `verify.mjs`.
8. Update the relevant docs and the V1→V2 migration table if the check changes an old behavior.
9. Run `npm run check`.

## Change scoring

Scoring changes are higher-risk than wording changes.

- Patch: wording or evidence only, no score change.
- Minor: point/weight changes.
- Major: added/removed checks, schema changes, or a changed total.

If a golden score changes:

- Update the fixture deliberately.
- Explain why in the pull request and `CHANGELOG.md`.
- Keep the V1 expectation under the V1 rubric.
- Never rewrite a historical report's score in place.

## Fixtures

- Add synthetic or sanitized fixtures only.
- Use placeholder names, `example.com` URLs, `555-01xx` phones, and `123 Example St`.
- Label synthetic fixtures with `"synthetic": true`.
- Do not add screenshots of a real client site.

## Tests

Run the full local gate:

```sh
npm run check
```

At minimum:

```sh
python3 -m unittest discover -s .opencode/skills/home-service-website-audit/scripts -p 'test_*.py'
node --test .opencode/skills/home-service-website-audit/scripts/test_pipeline.mjs
node .opencode/skills/home-service-website-audit/scripts/verify.mjs \
  --run examples/acme-plumbing \
  --report examples/acme-plumbing/full-report.md \
  --one-page examples/acme-plumbing/one-page.md \
  --index examples/README.md \
  --mutation --fixture --synthetic
```

## Documentation

- One canonical source per concept.
- Link instead of duplicating.
- If behavior changes, update the doc and the generated artifact in the same pull request.
- Keep contractor-facing language plain: "Your mobile estimate form is cut off" not "the form container violates viewport bounds."

## Privacy and evidence

- No real client data in the public repository.
- No credentials, `.env` files, API keys, cookies, or browser profiles.
- No customer PII.
- Public examples must be labeled synthetic or sanitized.
- Run `npm run check:privacy` before opening a pull request.
- Read [`docs/privacy.md`](docs/privacy.md).

## Pull requests

- Keep the change focused.
- Describe what changed and why.
- Include the test commands you ran.
- Note any rubric-version change.
- Note any score change and why it is intentional.
- Do not include generated client reports or raw evidence.

## Code of conduct

By participating, you agree to follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Security

Do not report a live credential or exploit in a public issue. See [`SECURITY.md`](SECURITY.md).
