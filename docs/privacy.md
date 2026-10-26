# Privacy and Public-Repository Safety

This repository is **public**. Treat every commit as publishable to the internet.

## The rules

1. **Raw audit evidence stays local.** `.audit/` and `audit-screens/` are gitignored. Do not force-add them.
2. **Client reports stay local by default.** `reports/*.md` is gitignored. Use `examples/` only for synthetic or properly sanitized examples.
3. **Never commit credentials.** No `.env` files, API keys, tokens, cookies, browser profiles, session stores, private URLs, or production IDs.
4. **Never commit customer PII.** No customer names, emails, phone numbers, addresses, review text, or private notes.
5. **Business information must be public and intentional.** A real business name is not automatically safe to publish in an audit. Default to anonymizing unless the business has explicitly approved publication.
6. **Screenshots can leak.** A screenshot may show a logged-in account, a customer name, a phone number, an address, a chat transcript, or a browser profile. Review every image before publishing.
7. **Do not rely on `.gitignore` alone.** Check `git status`, `git ls-files`, and the staged diff before committing.

## What stays local

| Path | Why |
|---|---|
| `.audit/` | Raw screenshots, Lighthouse JSON, signals, filled audits, reports |
| `audit-screens/` | Legacy raw screenshot directory |
| `reports/*.md` | Generated client one-pagers, full reports, and `reports/index.local.md` |
| `evals/*` | Cross-model eval runs, which can contain client evidence |
| `.env`, `.env.*` | Secrets and local configuration |
| `node_modules/` | Dependencies |
| Browser profiles, HAR files, cookies | Session data |

These are ignored by default. Do not add exceptions for real client data.

## What may be public

- The rubric, scorer, renderer, verifier, collector, tests, and docs.
- Synthetic fixtures with placeholder names, URLs, phones, addresses, and evidence.
- Sanitized examples that contain only public business information and no customer PII.
- Generated artifacts such as `rubric.md`, `coverage-matrix.json`, and `portable-checklist.md`.

## Sanitization checklist

Before publishing an example or fixture:

- [ ] Business name replaced with a synthetic name.
- [ ] URL replaced with `example.com` or `*.example`.
- [ ] Phone numbers replaced with `555-01xx`.
- [ ] Addresses replaced with `123 Example St`.
- [ ] License, bond, and policy numbers replaced with placeholders.
- [ ] Customer names, review quotes, emails, and job details removed or synthesized.
- [ ] Screenshots removed or rebuilt from synthetic pages.
- [ ] Analytics IDs, scheduler widget IDs, API keys, and ad account IDs removed.
- [ ] Private notes and internal recommendations removed.
- [ ] The example is labeled **synthetic** or **sanitized**.
- [ ] `git diff --cached` reviewed.
- [ ] `npm run check:privacy` passes.

## Git history

Removing a file from the current tree does **not** remove it from Git history. A public repository exposes the full history.

Earlier revisions of this repository contained real named client audit artifacts and cross-model eval snapshots, including third-party scheduler embed keys and public business contact details. They were removed from the current tree, and the public branch history was rewritten on **2026-10-26**. The old branch tip is no longer reachable from `origin/main`.

Old clones, forks, and caches may still contain the earlier revision. Delete and re-clone any old clone, and delete or recreate any fork. GitHub may retain unreachable objects in its internal caches for a period; contact GitHub Support if a complete purge is required.

If sensitive material is ever committed again:

1. Rotate any exposed credential immediately, even if the file is now deleted.
2. Decide whether the repository must be made private temporarily.
3. Use a history-rewrite tool such as `git filter-repo` only with explicit owner authorization.
4. Force-push and tell collaborators to re-clone.
5. Re-run the secret scan on the rewritten history.

History rewriting is destructive and requires explicit owner authorization, a backup, and coordination with collaborators.

## Secret and PII scan

```sh
npm run check:privacy
node scripts/privacy_scan.mjs --history
```

The default scan checks the current tree for private-key blocks, common token prefixes, `.env` files, and forbidden evidence paths. `--history` also scans Git history and should pass after the rewrite. If it fails, stop and investigate before publishing. The scan is a safety net, not a substitute for human review.

## Reporting a security problem

See [`SECURITY.md`](../SECURITY.md). Do not open a public issue that contains a live credential, customer data, or an exploitable detail. Use GitHub's private vulnerability reporting if available.

## Client-data handling outside the repository

- Store raw evidence in a private local directory or a private client workspace.
- Share reports with the client through an agreed private channel.
- Delete raw evidence when it is no longer needed.
- Do not put client data into a public issue, pull request, gist, or example.
- Do not use real client data in an LLM eval unless the client has approved it and the data is handled under the appropriate agreement.

## If you are unsure

Default to **not committing**. A missing example is cheaper than a privacy incident.
