#!/usr/bin/env node
/** Privacy and secret safety net for a public repository. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const HELP = `Website Revenue Leak Scorecard — privacy scan

Usage:
  node scripts/privacy_scan.mjs [--history]

Default: scans tracked files in the current tree.
--history: also scans the text patch of all Git history (slower, may be large).

Exit 1 on a hard finding: tracked secret, .env, raw evidence, or client report.
Warnings are printed but do not fail.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}
const history = process.argv.includes("--history");

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024, ...options });
}

let tracked;
try {
  tracked = git(["ls-files", "--cached", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
} catch (error) {
  console.error(`error: could not list tracked files: ${error.message}`);
  process.exit(2);
}

const forbiddenPaths = [
  [/^\.audit\//, "raw audit evidence"],
  [/^audit-screens\//, "raw screenshot evidence"],
  [/^reports\/(?!README\.md$).+\.md$/, "client report"],
  [/^evals\/(?!README\.md$).+/, "eval run (may contain client evidence)"],
  [/(^|\/)\.env(?!\.example)(\.|$)/, ".env file"],
  [/(^|\/)cookies\.txt$/, "cookie jar"],
  [/\.(pem|key|p12)$/i, "private key material"],
];

const secretPatterns = [
  [/-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/, "private key block"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, "GitHub token"],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}\b/, "GitHub fine-grained token"],
  [/\bsk-[A-Za-z0-9]{20,}\b/, "API secret key"],
  [/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/, "Slack token"],
  [/\bAIza[0-9A-Za-z_-]{30,}\b/, "Google API key"],
  [/\b(?:api[_-]?key|apikey|secret|token|password)\b\s*[:=]\s*["'][A-Za-z0-9_./+=-]{24,}["']/i, "credential assignment"],
  [/[?&](?:api[_-]?key|apikey|access[_-]?token|secret|token)=([A-Za-z0-9_./+=-]{20,})/i, "credential in URL query"],
];

const phoneWarning = /\b(?!555)\d{3}[-.]\d{3}[-.]\d{4}\b/g;
const emailWarning = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const errors = [];
const warnings = [];

function scanText(label, text) {
  for (const [pattern, name] of secretPatterns) {
    const match = text.match(pattern);
    if (match) errors.push(`${label}: possible ${name}: ${match[0].slice(0, 80)}`);
  }
  for (const match of text.match(phoneWarning) || []) {
    warnings.push(`${label}: phone-like value ${match} (verify it is a placeholder)`);
  }
  for (const match of text.match(emailWarning) || []) {
    if (match.endsWith("@example.com") || match.endsWith("@example.test") || match.includes("users.noreply.github.com")) continue;
    warnings.push(`${label}: email-like value ${match} (verify it is public and intentional)`);
  }
}

for (const file of tracked) {
  for (const [pattern, label] of forbiddenPaths) {
    if (pattern.test(file)) errors.push(`${file}: forbidden path (${label})`);
  }
  if (!/\.(md|json|mjs|js|py|ya?ml|txt|toml|html|css|sh|example)$/i.test(file)) continue;
  try {
    scanText(file, fs.readFileSync(file, "utf8"));
  } catch {
    // Binary or unreadable tracked file; path rules still apply.
  }
}

if (history) {
  try {
    const patch = git(["log", "-p", "--all", "--no-color", "--no-ext-diff"]);
    scanText("git history", patch);
  } catch (error) {
    warnings.push(`git history scan failed: ${error.message}`);
  }
}

console.log(`Scanned ${tracked.length} tracked files${history ? " plus Git history" : ""}.`);
for (const warning of [...new Set(warnings)].slice(0, 50)) console.log(`warn  ${warning}`);
if (warnings.length > 50) console.log(`warn  ... ${warnings.length - 50} more`);
for (const error of [...new Set(errors)]) console.error(`FAIL  ${error}`);

if (errors.length) {
  console.error(`\n${errors.length} hard privacy finding(s). Remove the data and rotate any exposed credential.`);
  process.exit(1);
}
console.log("ok: no hard privacy findings.");
