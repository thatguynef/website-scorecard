# Security Policy

## Supported versions

The current V2 line is supported. Legacy V1 is preserved for historical reproducibility but does not receive feature updates.

## Reporting a vulnerability

Please **do not open a public issue** for a live vulnerability, exposed credential, or customer-data leak.

Use GitHub's private vulnerability reporting for this repository if it is available. If it is not available, contact the maintainer through the GitHub profile associated with the repository and ask for a private channel. Do not include the secret itself in the first message.

Include:

- what is affected,
- how to reproduce it,
- the potential impact,
- whether any credential or personal data is exposed,
- a suggested fix if you have one.

## Scope

In scope:

- credential exposure in the repository or Git history,
- customer PII or private client data in tracked files,
- path traversal or unsafe file handling in the scripts,
- command injection or unsafe shell interpolation,
- URL validation bypasses in the collector,
- generated-output path issues,
- a verifier invariant that can be bypassed,
- a privacy regression in the public examples.

Out of scope:

- findings about a website that was audited with this tool,
- the accuracy of a third-party Lighthouse score,
- denial-of-service against a site you do not own,
- social engineering.

## If a credential was committed

1. Rotate it immediately. Deleting the file does not revoke the credential.
2. Remove it from the current tree.
3. Tell the maintainer privately.
4. Do not assume the history is clean. Removing a file from `HEAD` does not remove it from earlier commits.
5. History rewriting requires explicit owner authorization and a coordinated force-push.

See [`docs/privacy.md`](docs/privacy.md) for the full history guidance.

## Non-destructive testing

The collector is designed not to submit forms, place calls, send texts, book appointments, create accounts, or enter payment details. A security report should not require you to violate that boundary. Use fixtures and local pages for testing.
