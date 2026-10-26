#!/usr/bin/env node
/**
 * Render a Website Revenue Leak Scorecard report from scores.json + content.json.
 *
 *   node render.mjs --scores scores.json --content content.json \
 *     --out reports/example-2026-10-26-one-page.md
 *
 *   node render.mjs --mode full --scores scores.json --content content.json \
 *     --out reports/example-full-report.md
 *
 * The script owns the tables and placeholders. The model owns the prose in
 * content.json: verdict, leaks, strengths, fixes, journey summaries, owner-data
 * opportunities, and next steps.
 */

import fs from "node:fs";
import path from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) return true;
  return v;
}
const has = (name) => process.argv.includes(`--${name}`);

const HELP = `Website Revenue Leak Scorecard renderer 2.0.0

Usage:
  node render.mjs --scores <json> --content <json> --out <md> [options]

Required:
  --scores <json>          scores.json from score.py
  --content <json>         Model-written prose and tables
  --out <md>               Output Markdown file

Optional:
  --mode one-page|full     Default: one-page
  --template <md>          Override the default template
  --help                   Show this help

The renderer never invents business facts. Missing content is shown as a
placeholder warning, and the verifier will reject unfilled placeholders.
`;

if (has("help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const scoresPath = arg("scores");
const contentPath = arg("content");
const outPath = arg("out");
const mode = String(arg("mode", "one-page"));
if (!scoresPath || !contentPath || !outPath) {
  console.error("error: --scores, --content, and --out are required\n");
  console.error(HELP);
  process.exit(2);
}
if (!["one-page", "full"].includes(mode)) {
  console.error("error: --mode must be one-page or full");
  process.exit(2);
}

let scores;
let content;
try {
  scores = JSON.parse(fs.readFileSync(scoresPath, "utf8"));
  content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
} catch (error) {
  console.error(`error: could not read input JSON: ${error.message}`);
  process.exit(2);
}

const v2 = scores.schema_version === "2.0";
if (mode === "full" && !v2) {
  console.error("error: full-report rendering is only available for V2 scores. Write V1 reports from the legacy template.");
  process.exit(2);
}

const defaultTemplate = v2
  ? path.join(
      import.meta.dirname,
      "..",
      "references",
      mode === "full" ? "v2-report-template.md" : "v2-one-page-template.md"
    )
  : path.join(import.meta.dirname, "..", "references", "legacy", "one-page-template-v1.md");
const templatePath = arg("template", defaultTemplate);
let template;
try {
  template = fs.readFileSync(templatePath, "utf8");
} catch (error) {
  console.error(`error: could not read template ${templatePath}: ${error.message}`);
  process.exit(2);
}

const confidenceLabel = (value) =>
  String(value || "").replaceAll("_", " ").toUpperCase();

function formatLeaks(leaks, includeConfidence = true) {
  if (!Array.isArray(leaks) || !leaks.length) return "_No leak prose supplied._";
  return leaks
    .map((leak, index) => {
      if (typeof leak === "string") return `**${index + 1}. ${leak}**`;
      const lines = [`### ${index + 1}. ${leak.title || "Untitled leak"}`];
      if (leak.stage) lines.push(`**Stage:** ${leak.stage}`);
      if (leak.what) lines.push(`**What is happening:** ${leak.what}`);
      if (leak.body) lines.push(leak.body);
      if (leak.evidence) lines.push(`**Evidence:** ${leak.evidence}`);
      if (leak.why) lines.push(`**Why it matters:** ${leak.why}`);
      if (leak.fix) lines.push(`**Fix:** ${leak.fix}`);
      if (includeConfidence) lines.push(`**Confidence:** ${confidenceLabel(leak.confidence || "verified")}`);
      return lines.join("\n\n");
    })
    .join("\n\n---\n\n");
}

function statusLabel(status) {
  const labels = {
    scored: "Scored",
    scored_plus_owner_data: "Scored + owner data",
    owner_data_required: "Owner data required",
    observed_unscored: "Observed, not scored",
  };
  return labels[status] || String(status || "").replaceAll("_", " ");
}

function formatJourney(journey, full = false) {
  let rows = journey || [];
  if (full) {
    const supplied = content.journey || [];
    rows = (scores.journey || []).map((base) => {
      const custom = supplied.find((row) => (row.stage || row.label) === base.label);
      return custom ? { ...base, ...custom } : base;
    });
  }
  if (!rows.length) return "_No journey summary supplied._";
  const lines = ["| Stage | Status | What we observed |", "|---|---|---|"];
  for (const row of rows) {
    const stage = row.label || row.stage || "Stage";
    const summary = row.summary || row.observed || (row.percent !== null && row.percent !== undefined ? `${row.percent}% of applicable points` : "");
    lines.push(`| ${stage} | ${statusLabel(row.status)} | ${summary || "—"} |`);
  }
  return lines.join("\n");
}

function ownerEntries(limit, full = false) {
  const supplied = Array.isArray(content.ownerData) ? content.ownerData : [];
  const merged = (scores.ownerDataRequired || []).map((entry) => {
    const custom = supplied.find((item) => item.id === entry.id || item.title === entry.title);
    if (!custom) return entry;
    if (full) return { ...entry, why: custom.why || entry.whyItMatters };
    return { ...entry, ...custom };
  });
  if (full) return merged;
  if (supplied.length) return supplied.slice(0, limit || supplied.length);
  return merged.slice(0, limit || undefined);
}

function formatOwnerData(limit, full = false) {
  const entries = ownerEntries(limit, full);
  if (!entries.length) return "_No owner-data opportunities supplied._";
  return entries
    .map((entry) => {
      if (typeof entry === "string") return `- ${entry}`;
      const questions = (entry.questions || []).map((q) => `  - ${q}`).join("\n");
      const head = `**${entry.title || "Opportunity"}**${entry.stage ? ` (${entry.stage})` : ""} — ${entry.why || entry.whyItMatters || ""}`;
      return questions ? `${head}\n${questions}` : head;
    })
    .join("\n\n");
}

function scoreTable() {
  const lines = ["| Area | Score |", "|---|---|"];
  for (const cat of scores.categories) {
    const earned = typeof cat.normalized === "number" ? cat.normalized.toFixed(1) : String(cat.earned);
    lines.push(`| ${cat.name} | ${earned} / ${cat.max} |`);
  }
  lines.push(`| **Total** | **${scores.display} / 100** |`);
  return lines.join("\n");
}

function legacyScoreTable() {
  const lines = ["| Area | Score |", "|---|---|"];
  for (const cat of scores.categories) {
    lines.push(`| ${cat.name} | ${cat.earned} / ${cat.max} |`);
  }
  lines.push(`| **Total** | **${scores.final} / ${scores.total_max}** |`);
  return lines.join("\n");
}

function fullScoreTable() {
  const lines = ["| Category | Earned | Applicable | Weight | Normalized |", "|---|---|---|---|---|"];
  for (const cat of scores.categories) {
    lines.push(
      `| ${cat.id}. ${cat.name} | ${cat.earned} | ${cat.applicable_max} | ${cat.max} | ${Number(cat.normalized).toFixed(2)} |`
    );
  }
  lines.push(`| **Total** | **${scores.final}** | **100** | **100** | **${Number(scores.total).toFixed(2)}** |`);
  return lines.join("\n");
}

function findingsTable() {
  const supplied = new Map((content.findings || []).map((f) => [f.id, f]));
  const lines = ["| ID | Stage | Score | Confidence | What we observed | Fix |", "|---|---|---|---|---|---|"];
  for (const check of scores.checks || []) {
    const finding = supplied.get(check.id) || {};
    const score = check.applicable ? `${check.score}/${check.max}` : "N/A";
    const confidence = check.applicable ? confidenceLabel(check.confidence) : "NOT APPLICABLE";
    const observed = finding.observed || (check.applicable ? (check.evidence || []).join("; ") : `N/A: ${check.na_reason || "not applicable"}`);
    const fix = finding.fix || (check.applicable ? "—" : "—");
    lines.push(`| ${check.id} | ${check.stage || "—"} | ${score} | ${confidence} | ${observed.replaceAll("|", "\\|")} | ${fix.replaceAll("|", "\\|")} |`);
  }
  return lines.join("\n");
}

function fixesTable() {
  const fixes = content.fixes || [];
  const hasChecks = fixes.some((f) => Array.isArray(f.checks) && f.checks.length);
  if (hasChecks) {
    return [
      "| # | Fix | Checks | Points | Effort |",
      "|---|---|---|---|---|",
      ...fixes.map(
        (f, i) => `| ${i + 1} | ${f.fix} | ${(f.checks || []).join(", ") || "—"} | ${f.points} | ${f.effort} |`
      ),
    ].join("\n");
  }
  return [
    "| # | Fix | Points | Effort |",
    "|---|---|---|---|",
    ...fixes.map((f, i) => `| ${i + 1} | ${f.fix} | ${f.points} | ${f.effort} |`),
  ].join("\n");
}

function strengths() {
  if (Array.isArray(content.strengths) && content.strengths.length) {
    return content.strengths.map((s) => `- ${s}`).join("\n");
  }
  const strong = (scores.categories || []).filter((c) => c.percent !== null && c.percent >= 75);
  return strong.length
    ? strong.map((c) => `- ${c.name}: ${c.normalized.toFixed(1)} / ${c.max}`).join("\n")
    : "_No category reached 75% of its applicable points._";
}

function nextSteps() {
  if (Array.isArray(content.nextSteps) && content.nextSteps.length) {
    return content.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  }
  return "_No next steps supplied._";
}

function executiveSummary() {
  if (Array.isArray(content.executiveSummary) && content.executiveSummary.length) {
    return content.executiveSummary.map((s) => `- ${s}`).join("\n");
  }
  return `- ${content.verdict || "See the findings below."}`;
}

function capLine() {
  if (!scores.cap_binding) return "";
  return `**Cap applied:** raw ${scores.total} capped at ${scores.cap} (${(scores.caps || []).map((c) => c.label).join("; ")}).`;
}

function evidenceNote() {
  if (content.evidenceNote) return content.evidenceNote;
  return `Evidence: ${scores.findings?.length || 0} scored checks, mobile 390×844 and desktop 1440×900. ` +
    `N/A checks: ${(scores.normalization?.na_checks || []).join(", ") || "none"}. ` +
    "See the run directory for screenshots, Lighthouse JSON, site map, and path traces.";
}

const fixNote = content.fixNote || "";
const values = {
  CLIENT: content.client ?? scores.meta?.client ?? "Client",
  URL: content.url ?? scores.meta?.url ?? "",
  TRADE: content.trade ?? scores.meta?.trade ?? "",
  MARKET: content.market ?? scores.meta?.market ?? scores.meta?.city ?? "",
  DATE: content.date ?? scores.meta?.date ?? "",
  SCORE: String(scores.display),
  BAND: scores.band_label,
  RUBRIC_VERSION: scores.rubric_version ?? content.rubricVersion ?? "",
  COLLECTOR_VERSION: scores.meta?.collector_version ?? "",
  SCORER_VERSION: scores.scorer_version ?? "",
  RUN_ID: scores.meta?.run_id ?? "",
  RUN_TIMESTAMP: scores.meta?.run_timestamp ?? scores.meta?.generated_at ?? "",
  VERSIONS: `Collector v${scores.meta?.collector_version ?? "?"} · Scorer v${scores.scorer_version ?? "?"}`,
  VERDICT: content.verdict ?? "",
  LEAKS: formatLeaks(content.leaks, v2),
  JOURNEY_TABLE: formatJourney(content.journeyOnePage || content.journey || scores.journey, mode === "full"),
  SCORE_TABLE: v2 ? (mode === "full" ? fullScoreTable() : scoreTable()) : legacyScoreTable(),
  FULL_SCORE_TABLE: v2 ? fullScoreTable() : "",
  FINDINGS_TABLE: v2 ? findingsTable() : "",
  STRENGTHS: strengths(),
  FIXES_TABLE: fixesTable(),
  FIX_NOTE: fixNote,
  OWNER_DATA: formatOwnerData(mode === "full" ? undefined : (content.ownerDataLimit || 4), mode === "full"),
  NEXT_STEPS: nextSteps(),
  EXECUTIVE_SUMMARY: executiveSummary(),
  CAP_LINE: capLine(),
  EVIDENCE_NOTE: evidenceNote(),
  FOOTER: content.footer ?? "",
  FULL_REPORT_LINK: content.fullReportLink ?? "full-report.md",
};

if (!v2) {
  // Legacy V1 template placeholders.
  values.SPANISH_SCORE = content.spanish?.score ?? "0 / 4";
  values.SPANISH_NOTE = content.spanish?.note ?? "";
}

let out = template;
for (const [key, value] of Object.entries(values)) {
  out = out.replaceAll(`{{${key}}}`, String(value ?? ""));
}

const leftovers = [...out.matchAll(/\{\{[A-Z0-9_]+\}\}/g)].map((m) => m[0]);
if (leftovers.length) {
  console.error(`warning: unfilled placeholders: ${[...new Set(leftovers)].join(", ")}`);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out.endsWith("\n") ? out : `${out}\n`);
console.log(`wrote ${outPath}`);
