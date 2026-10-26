#!/usr/bin/env node
/**
 * Add or update a row in the local reports index.
 *
 *   node index.mjs --client "Example Co." --market "Example County, CA" \
 *     --score 68 --band "C — Average" --date 2026-10-26 \
 *     --one-page example-2026-10-26-one-page.md \
 *     --full ../audit-example.md
 *
 * Idempotent: a row with the same date + client is replaced, not duplicated.
 */

import fs from "node:fs";
import path from "node:path";

const HELP = `Website Scorecard reports index

Usage:
  node index.mjs --client <name> --score <n> [options]

Required:
  --client <name>          Client or example name
  --score <n>              Display score / 100

Optional:
  --reports <md>           Index file, default reports/index.local.md
  --market <text>          Market label
  --band <text>            Band label, e.g. "C - Average"
  --date <YYYY-MM-DD>      Audit date, default today
  --one-page <path>        One-page link
  --full <path>            Full report link
  --help                   Show this help

Idempotent: the same date + client updates the row instead of duplicating it.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

const reportsPath = arg("reports", "reports/index.local.md");
const client = arg("client");
const market = arg("market", "");
const score = arg("score");
const band = arg("band", "");
const date = arg("date", new Date().toISOString().slice(0, 10));
const onePage = arg("one-page", "");
const full = arg("full", "");

if (!client || !score) {
  console.error("usage: index.mjs --client <name> --score <n> [--market ...] [--band ...] [--date ...] [--one-page ...] [--full ...]");
  process.exit(2);
}

const link = (label, href) => (href ? `[${label}](${href})` : label);
const links = [link("One-page", onePage), link("Full audit", full)].filter(Boolean).join(" · ");
const row = `| ${date} | ${client} | ${market} | **${score}/100** | ${band} | ${links} |`;

if (!fs.existsSync(reportsPath)) {
  fs.mkdirSync(path.dirname(reportsPath), { recursive: true });
  fs.writeFileSync(reportsPath, "| Date | Client | Market | Score | Band | Reports |\n|---|---|---|---|---|---|\n");
}
let text = fs.readFileSync(reportsPath, "utf8");
const lines = text.split("\n");

const headerIndex = lines.findIndex((l) => l.startsWith("| Date | Client | Market | Score | Band | Reports |"));
if (headerIndex === -1) {
  console.error(`could not find the reports table in ${reportsPath}`);
  process.exit(1);
}

let insertAt = headerIndex + 2;
if (!lines[headerIndex + 1]?.startsWith("|---")) {
  console.error("reports table is missing its separator row");
  process.exit(1);
}

const existing = lines.findIndex(
  (l, i) => i > headerIndex && l.startsWith(`| ${date} | ${client} |`)
);
if (existing !== -1) {
  lines[existing] = row;
  console.log(`updated row for ${client} (${date})`);
} else {
  lines.splice(insertAt, 0, row);
  console.log(`added row for ${client} (${date})`);
}

fs.writeFileSync(reportsPath, lines.join("\n"));
