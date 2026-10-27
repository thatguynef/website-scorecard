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
import { reportDirFor, reportLinks } from "./report-paths.mjs";

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
  --out <dir>              Raw audit output directory
  --report-dir <dir>       Report output directory, default: reports/<domain>/<run-id>
  --skip-lighthouse        Skip Lighthouse
  --prepare                Copy audit.json to the report directory as audit.filled.json
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
const shellQuote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;
const localDate = (now = new Date()) =>
  new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const localRunId = (now = new Date()) =>
  new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace(/:/g, "");

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
const runId = String(arg("run-id", localRunId()));
const out = String(arg("out", path.join(".audit", slug, runId)));
const reportDirArg = arg("report-dir");
if (reportDirArg === true) {
  console.error("error: --report-dir requires a path");
  process.exit(2);
}
let reportDir;
try {
  reportDir = String(reportDirArg || reportDirFor(url, runId));
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(2);
}
const reportPaths = reportLinks(reportDir);
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
const filledPath = path.resolve(reportDir, "audit.filled.json");
const scoresPath = path.resolve(reportDir, "scores.json");
const scorecardPath = path.resolve(reportDir, "scorecard.md");
const contentPath = path.resolve(reportDir, "content.json");
const onePagePath = path.resolve(reportDir, "one-page.md");
const fullReportPath = path.resolve(reportDir, "full-report.md");
const verificationPath = path.resolve(reportDir, "verification.json");

try {
  fs.mkdirSync(reportDir, { recursive: true });
} catch (error) {
  console.error(`error: could not create report directory ${reportDir}: ${error.message}`);
  process.exit(1);
}
console.log(`\nReport directory: ${reportDir}`);

let auditDate = localDate();
try {
  auditDate = JSON.parse(fs.readFileSync(auditPath, "utf8")).meta?.date || auditDate;
} catch {
  // Keep the local fallback if the audit manifest cannot be read.
}

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
     --input ${shellQuote(filledPath)} \\
     --out ${shellQuote(scoresPath)} \\
     --markdown ${shellQuote(scorecardPath)} --strict
4. Write content.json and README.md in ${reportDir}, then render:
   node .opencode/skills/home-service-website-audit/scripts/render.mjs \\
     --scores ${shellQuote(scoresPath)} \\
     --content ${shellQuote(contentPath)} \\
     --out ${shellQuote(onePagePath)}
   node .opencode/skills/home-service-website-audit/scripts/render.mjs --mode full \\
     --scores ${shellQuote(scoresPath)} \\
     --content ${shellQuote(contentPath)} \\
     --out ${shellQuote(fullReportPath)}
5. Verify:
   node .opencode/skills/home-service-website-audit/scripts/verify.mjs \\
     --run ${shellQuote(out)} \\
     --filled ${shellQuote(filledPath)} \\
     --scores ${shellQuote(scoresPath)} \\
     --report ${shellQuote(fullReportPath)} \\
     --one-page ${shellQuote(onePagePath)} \\
     --index reports/index.local.md \\
     --out ${shellQuote(verificationPath)} --mutation --fixture
6. Index after verification:
   node .opencode/skills/home-service-website-audit/scripts/index.mjs \\
     --reports reports/index.local.md \\
     --client ${shellQuote(client)} --market ${shellQuote(city)} \\
     --score <score> --band "<band>" --date ${auditDate} \\
     --one-page ${shellQuote(reportPaths.onePage)} \\
     --full ${shellQuote(reportPaths.fullReport)}
`);
