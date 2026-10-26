#!/usr/bin/env node
/**
 * Single entrypoint for a Website Revenue Leak Scorecard run.
 *
 *   npm run audit -- --url https://example.com --client "Example Co." \
 *     --trade plumbing --city "San Diego" --service plumbing
 *
 * Runs the collector, then prints the exact scoring, rendering, and verification
 * commands. The stages remain independently runnable.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HELP = `Website Revenue Leak Scorecard — audit entrypoint 2.0.0

Usage:
  npm run audit -- --url <url> --client <name> --trade <trade> --city <city> [options]

Required:
  --url <url>              Public site to audit
  --client <name>          Business name
  --trade <trade>          Trade, e.g. plumbing, hvac, roofing
  --city <city>            Target market

Recommended:
  --service <term>         Primary service keyword, default: trade
  --max-pages <n>          Pages to crawl, default 12
  --lh-runs <n>            Lighthouse runs, default 3
  --language <codes>       Preferred languages, e.g. en,es
  --config <json>          Configuration file

Optional:
  --slug <slug>            Output slug, default: hostname
  --run-id <id>            Run id, default: YYYY-MM-DDTHHMM
  --out <dir>              Output directory
  --skip-lighthouse        Skip Lighthouse
  --prepare                Copy audit.json to audit.filled.json after collection
  --help                   Show this help

Examples:
  npm run audit -- --url https://example.com --client "Example Co." --trade plumbing --city "San Diego"
  npm run audit -- --url https://example.com --client "Example Co." --trade roofing --city "Austin" --language en,es --prepare

Non-destructive:
  No form submission, call, text, booking, account creation, or payment.
`;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) return true;
  return v;
}
const has = (name) => process.argv.includes(`--${name}`);

if (has("help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const url = arg("url");
const client = arg("client");
const trade = arg("trade");
const city = arg("city");
const missing = [
  ["--url", url],
  ["--client", client],
  ["--trade", trade],
  ["--city", city],
].filter(([, value]) => !value || value === true);

if (missing.length) {
  console.error(`error: missing required ${missing.map(([name]) => name).join(", ")}\n`);
  console.error(HELP);
  process.exit(2);
}

try {
  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("URL must start with http:// or https://");
} catch (error) {
  console.error(`error: invalid --url: ${error.message}`);
  process.exit(2);
}

const slug = String(arg("slug", new URL(url).hostname.replace(/^www\./, "").replace(/\./g, "-")));
const runId = String(arg("run-id", new Date().toISOString().slice(0, 16).replace(/:/g, "")));
const out = String(arg("out", path.join(".audit", slug, runId)));
const service = String(arg("service", trade));
const maxPages = String(arg("max-pages", "12"));
const lhRuns = String(arg("lh-runs", "3"));
const config = arg("config");
const language = arg("language");

const collectPath = path.join(
  import.meta.dirname,
  "..",
  ".opencode",
  "skills",
  "home-service-website-audit",
  "scripts",
  "collect.mjs"
);

const collectArgs = [
  collectPath,
  "--url", url,
  "--client", client,
  "--slug", slug,
  "--run-id", runId,
  "--out", out,
  "--city", city,
  "--trade", trade,
  "--service", service,
  "--max-pages", maxPages,
  "--lh-runs", lhRuns,
];
if (config && config !== true) collectArgs.push("--config", config);
if (language && language !== true) collectArgs.push("--language", language);
if (has("skip-lighthouse")) collectArgs.push("--skip-lighthouse");

console.log(`\nCollecting ${url}\nRun directory: ${out}\n`);
const result = spawnSync(process.execPath, collectArgs, { stdio: "inherit" });
if (result.error) {
  console.error(`error: could not start collector: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

const auditPath = path.resolve(out, "audit.json");
const filledPath = path.resolve(out, "audit.filled.json");
if (has("prepare") && fs.existsSync(auditPath)) {
  fs.copyFileSync(auditPath, filledPath);
  console.log(`\nPrepared ${filledPath}`);
  console.log("Fill every applicable null check with evidence and confidence before scoring.\n");
}

console.log(`Next:

1. Review screenshots in ${path.join(out, "evidence")}
2. Fill judgment checks in ${auditPath}
   Save as ${filledPath}
3. Score:
   python3 .opencode/skills/home-service-website-audit/scripts/score.py \\
     --input ${filledPath} \\
     --out ${path.join(out, "scores.json")} \\
     --markdown ${path.join(out, "scorecard.md")} --strict
4. Write content.json, then render:
   node .opencode/skills/home-service-website-audit/scripts/render.mjs \\
     --scores ${path.join(out, "scores.json")} \\
     --content ${path.join(out, "content.json")} \\
     --out reports/${slug}-one-page.md
   node .opencode/skills/home-service-website-audit/scripts/render.mjs --mode full \\
     --scores ${path.join(out, "scores.json")} \\
     --content ${path.join(out, "content.json")} \\
     --out reports/${slug}-full-report.md
5. Verify:
   node .opencode/skills/home-service-website-audit/scripts/verify.mjs \\
     --run ${out} \\
     --report reports/${slug}-full-report.md \\
     --one-page reports/${slug}-one-page.md \\
     --index reports/README.md --mutation --fixture
`);
