#!/usr/bin/env node
/**
 * Periodic cross-model eval harness (judgment-only, frozen evidence).
 *
 *   node eval.mjs --snapshot .audit/example/2026-10-26T1000 \
 *     --models "opencode/deepseek-v4.1-flash-free,opencode/mimo-v2.6-flash-free,opencode/qwen3.8-flash" \
 *     --judge opencode/gpt-6-luna \
 *     --out evals/2026-10-25
 *
 * The harness copies only evidence + signals (no scores, no filled audit) into
 * isolated temp directories, runs each model blind, then has a different model
 * judge the same checks. It never crawls the site and never shows the expected
 * score to an auditor.
 *
 *   --mock   run the comparison/report logic with synthetic results (no calls)
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) return true;
  return v;
}

const has = (name) => process.argv.includes(`--${name}`);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_RUBRIC = path.join(ROOT, "references", "rubric.json");

const HELP = `Website Revenue Leak Scorecard — cross-model eval

Usage:
  node eval.mjs --snapshot <run-dir> --models a,b,c --judge model [--out dir] [--checks RL-...] [--mock]

Options:
  --snapshot <dir>      Frozen audit run with audit.json, site-map.json, paths.json
  --models <list>       Comma-separated auditor models
  --judge <model>       Judge model; must differ from the auditors
  --checks <list>       Comma-separated V2 check IDs
  --out <dir>           Output directory, default evals/<date>
  --mock                Run the comparison/report logic without model calls
  --timeout <ms>        Per-model timeout, default 180000
  --help                Show this help

The eval is blind: evidence is inlined, no tools, no browsing, no project files.
`;

if (has("help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const SNAPSHOT = path.resolve(arg("snapshot"));
const MODELS = String(arg("models", "opencode/deepseek-v4.1-flash-free,opencode/mimo-v2.6-flash-free,opencode/qwen3.8-flash"))
  .split(",").map((s) => s.trim()).filter(Boolean);
const JUDGE = arg("judge", "opencode/gpt-6-luna");
const CHECKS = String(arg("checks", "RL-UND-01,RL-UND-03,RL-CON-02,RL-CON-05,RL-CON-08,RL-RSP-01,RL-RSP-05,RL-TRU-01,RL-TRU-02,RL-MOB-02,RL-FND-01,RL-MSR-01,RL-UND-08"))
  .split(",").map((s) => s.trim()).filter(Boolean);
const OUT = path.resolve(arg("out", `evals/${new Date().toISOString().slice(0, 10)}`));
const RUBRIC_PATH = path.resolve(arg("rubric", DEFAULT_RUBRIC));
const TIMEOUT = Number(arg("timeout", 180000));
const MOCK = has("mock");

if (!SNAPSHOT) {
  console.error("usage: eval.mjs --snapshot <run-dir> --models a,b,c --judge model [--out dir] [--checks A1,...] [--mock]");
  process.exit(2);
}

const rubric = JSON.parse(fs.readFileSync(RUBRIC_PATH, "utf8"));
const byId = Object.fromEntries(rubric.items.map((i) => [i.id, i]));
const missingChecks = CHECKS.filter((c) => !byId[c]);
if (missingChecks.length) {
  console.error(`unknown checks: ${missingChecks.join(",")}`);
  process.exit(2);
}

const auditFile = fs.existsSync(path.join(SNAPSHOT, "audit.json"))
  ? "audit.json"
  : "audit.filled.json";
const audit = JSON.parse(fs.readFileSync(path.join(SNAPSHOT, auditFile), "utf8"));
const siteMap = JSON.parse(fs.readFileSync(path.join(SNAPSHOT, "site-map.json"), "utf8"));
const paths = JSON.parse(fs.readFileSync(path.join(SNAPSHOT, "paths.json"), "utf8"));
const evidenceDir = path.join(SNAPSHOT, "evidence");

function pickSignal(s = {}) {
  return {
    title: s.title, meta: s.meta, h1: s.h1, h2: s.h2,
    viewportMeta: s.viewportMeta, innerWidth: s.innerWidth, bodyFont: s.bodyFont,
    scrollWidth: s.scrollWidth,
    tel: s.tel?.map((t) => t.h),
    sms: s.sms?.map((t) => t.h),
    forms: s.forms?.map((f) => ({
      fields: f.fields.filter((x) => !["hidden", "submit"].includes(x.type)).map((x) => ({ type: x.type, name: x.name, placeholder: x.placeholder, required: x.required, autocomplete: x.autocomplete, hasLabel: x.hasLabel, visible: x.visible })),
      submitVisible: f.submitVisible,
    })),
    analytics: s.analytics,
    chatWidgets: s.chatWidgets,
    phoneHits: s.phoneHits,
    rating: s.rating,
    reviewCount: s.reviewCount,
    hasHours: s.hasHours,
    hasEmergency: s.hasEmergency,
    hasResponsePromise: s.hasResponsePromise,
    hasLicensing: s.hasLicensing,
    hasVideo: s.hasVideo,
    hasReferral: s.hasReferral,
    fixedLinks: s.fixed?.flatMap((f) => f.links?.map((l) => l.h) || []).filter(Boolean),
    ctaAboveFold: s.ctaAboveFold?.map((c) => c.t),
    aboveFold: s.aboveFold,
    smallTargets: s.smallTargets,
    headerOverlaps: s.headerOverlaps,
    schema: s.schema,
    priceHits: s.priceHits,
    hasFinancing: s.hasFinancing,
    hasWarranty: s.hasWarranty,
    hasReviews: s.hasReviews,
    hasMembership: s.hasMembership,
    bodyText: (s.bodyText || "").slice(0, 1800),
    clipped: s.clipped?.length || 0,
    jsErrors: s.jsErrors || [],
  };
}

const bundle = {
  note: "Frozen evidence bundle. Do not browse the web. Score only from these signals and the screenshots.",
  url: audit.meta.url,
  client: audit.meta.client,
  city: audit.meta.city,
  service: audit.meta.service,
  configuration: audit.meta.configuration,
  journeyStages: Object.fromEntries((audit.journey || []).map((stage) => [stage.id, stage])),
  pages: siteMap.pages,
  page_evidence: siteMap.pages.map((page) => {
    const mobileSignals = audit.signals?.mobile || [];
    const s = mobileSignals.find((x) => x.url === page.url) || {};
    return {
      url: page.url,
      type: page.type,
      h1: page.h1,
      title: s.title,
      bodyText: (s.bodyText || "").slice(0, 1800),
      links: (s.links || []).map((l) => l.h).filter((h) => h && !h.startsWith("#")).slice(0, 30),
      tel: s.tel?.length || 0,
      forms: s.forms?.length || 0,
      priceHits: s.priceHits || [],
      hasFinancing: !!s.hasFinancing,
      hasWarranty: !!s.hasWarranty,
      hasReviews: !!s.hasReviews,
      hasMembership: !!s.hasMembership,
      jsErrors: s.jsErrors || [],
    };
  }),
  home: {
    mobile: pickSignal((audit.signals?.mobile || [])[0]),
    desktop: pickSignal((audit.signals?.desktop || [])[0]),
  },
  scheduler: audit.scheduler || {},
  paths: paths.paths,
  screenshots: fs.existsSync(evidenceDir) ? fs.readdirSync(evidenceDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [],
};

function rubricExcerpt(ids) {
  const lines = [];
  for (const id of ids) {
    const item = byId[id];
    lines.push(`### ${item.id}. ${item.title} — ${item.max} points`);
    lines.push(`Stage: ${item.journeyStage} · Applicability: ${item.applicability} · Severity: ${item.severity} · Viewports: ${item.viewports.join(", ")} · Evidence: ${item.evidence}`);
    if (item.split) {
      for (const [vp, anchors] of Object.entries(item.anchors)) {
        lines.push(`**${vp} (${item.split[vp]} pts)**`);
        for (const score of Object.keys(anchors).sort((a, b) => Number(b) - Number(a))) {
          lines.push(`- ${score}: ${anchors[score]}`);
        }
      }
    } else {
      for (const score of Object.keys(item.anchors).sort((a, b) => Number(b) - Number(a))) {
        lines.push(`- ${score}: ${item.anchors[score]}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

const EXCERPT = rubricExcerpt(CHECKS);
const EVIDENCE_JSON = JSON.stringify(bundle, null, 2);

function auditorPrompt() {
  return `You are an independent website auditor scoring a local home service site. You are not being evaluated; score from the evidence below.

Do not use tools. Do not read files. Do not browse the web. The entire evidence bundle is in this prompt. Do not guess: if the evidence does not show it, score 0.

## Evidence

\`\`\`json
${EVIDENCE_JSON}
\`\`\`

## Rubric

${EXCERPT}

## Output

Return ONLY a JSON object, no prose and no code fence:

{"checks":{"RL-UND-01":{"score":2,"confidence":"verified","evidence":["M-01"],"rationale":"one sentence"}}}

Score every check exactly once. Scores must be one of the numbers in the rubric. If the snapshot configuration makes a conditional check not applicable, return {"score":null,"applicable":false,"confidence":"not_applicable","rationale":"..."}. Use confidence "verified" when the finding is directly observable, or "strong_signal" when the evidence strongly suggests a problem but the business outcome cannot be proven. Never use "owner_data_required" for a scored check.`;
}

function judgePrompt(results) {
  const anonymized = Object.entries(results)
    .map(([label, r]) => `Model ${label}: ${JSON.stringify(r.data?.checks || {}, null, 2)}`)
    .join("\n\n");
  return `You are the judge for a cross-model website audit eval. Independently score each check from the evidence, then compare the three anonymous models.

Do not use tools. Do not read files. Do not browse the web. The entire evidence bundle is in this prompt. Do not guess: if the evidence does not show it, score 0.

## Evidence

\`\`\`json
${EVIDENCE_JSON}
\`\`\`

## Rubric

${EXCERPT}

## Anonymous model scores

${anonymized}

## Output

Return ONLY a JSON object:

{"checks":{"RL-UND-01":{"score":2,"confidence":"verified","rationale":"..."}},"ambiguous":["RL-TRU-01"]}

The \`ambiguous\` array lists checks where the models differ by more than 1 point. Score every check exactly once and include a confidence state. Use applicable=false with score=null for a conditional check that is N/A in the snapshot configuration.`;
}

function repairBraces(s) {
  const stack = [];
  let inStr = false;
  let esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }
  let out = s;
  while (stack.length) out += stack.pop() === "{" ? "}" : "]";
  return out;
}

function parseJson(text) {
  const t = String(text || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : t;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("no JSON object in output");
  const slice = candidate.slice(first, last + 1);
  try { return JSON.parse(slice); } catch {
    return JSON.parse(repairBraces(slice));
  }
}

function runModel(model, cwd, prompt) {
  const args = ["run", "-m", model, "--format", "default", "--standalone", prompt];
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = spawnSync("opencode", args, {
      cwd, encoding: "utf8", timeout: TIMEOUT, maxBuffer: 20 * 1024 * 1024,
    });
    const raw = `${res.stdout || ""}\n${res.stderr || ""}`.trim();
    last = { raw, status: res.status, error: res.error };
    if (raw) {
      try {
        const data = parseJson(raw);
        if (data && data.checks) return { ok: true, data, raw, attempts: attempt };
      } catch {}
    }
    const retryable = /429|rate limit|overloaded|temporarily|try again/i.test(raw);
    if (attempt < 3 && (retryable || res.status !== 0)) {
      sleep(attempt * 2000);
      continue;
    }
    break;
  }
  return { ok: false, data: null, raw: last?.raw || "", error: last?.error?.message || "model call failed", attempts: 3 };
}

function setupBlind(dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "signals.json"), JSON.stringify(bundle, null, 2));
  fs.writeFileSync(path.join(dir, "prompt.md"), auditorPrompt());
  if (fs.existsSync(evidenceDir)) {
    fs.cpSync(evidenceDir, path.join(dir, "evidence"), { recursive: true });
  }
}

const MODEL_LABELS = MODELS.map((_, i) => String.fromCharCode(65 + i));
const modelLabel = (i) => MODEL_LABELS[i] || `M${i + 1}`;
const safe = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), "audit-eval-"));
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "models"), { recursive: true });
fs.mkdirSync(path.join(OUT, "judge"), { recursive: true });

const results = {};

if (MOCK) {
  const base = Object.fromEntries(CHECKS.map((id) => [id, 2]));
  const mk = (over = {}) => ({
    checks: Object.fromEntries(CHECKS.map((id) => [id, {
      score: over[id] ?? base[id],
      confidence: "verified",
      evidence: ["M-01"],
      rationale: "mock",
    }])),
  });
  MODELS.forEach((m, i) => {
    const over = i === 1 ? { [CHECKS[0]]: 1 } : {};
    results[modelLabel(i)] = { ok: true, data: mk(over), raw: "mock", attempts: 0, model: m };
  });
  results.judge = { ok: true, data: { checks: Object.fromEntries(CHECKS.map((id) => [id, { score: base[id], confidence: "verified", rationale: "mock judge" }])), ambiguous: [] }, raw: "mock", attempts: 0, model: JUDGE };
} else {
  for (let i = 0; i < MODELS.length; i++) {
    const label = modelLabel(i);
    const dir = path.join(runRoot, label);
    setupBlind(dir);
    const res = runModel(MODELS[i], dir, auditorPrompt());
    results[label] = { ...res, model: MODELS[i] };
    fs.writeFileSync(path.join(dir, "raw.txt"), res.raw || "");
    if (res.data) fs.writeFileSync(path.join(dir, "result.json"), JSON.stringify(res.data, null, 2));
  }

  // Judge sees the same evidence and anonymized model scores.
  const judgeDir = path.join(runRoot, "judge");
  setupBlind(judgeDir);
  fs.writeFileSync(path.join(judgeDir, "prompt.md"), judgePrompt(results));
  const jr = runModel(JUDGE, judgeDir, judgePrompt(results));
  results.judge = { ...jr, model: JUDGE };
  fs.writeFileSync(path.join(judgeDir, "raw.txt"), jr.raw || "");
  if (jr.data) fs.writeFileSync(path.join(judgeDir, "result.json"), JSON.stringify(jr.data, null, 2));
}

// Copy prompts/results into the project for the record.
for (let i = 0; i < MODELS.length; i++) {
  const label = modelLabel(i);
  const src = path.join(runRoot, label);
  const dst = path.join(OUT, "models", `${label}-${safe(MODELS[i])}`);
  fs.mkdirSync(dst, { recursive: true });
  for (const f of ["prompt.md", "signals.json", "raw.txt", "result.json"]) {
    if (fs.existsSync(path.join(src, f))) fs.copyFileSync(path.join(src, f), path.join(dst, f));
  }
  results[label].dir = path.relative(OUT, dst);
}
{
  const src = path.join(runRoot, "judge");
  for (const f of ["prompt.md", "signals.json", "raw.txt", "result.json"]) {
    if (fs.existsSync(path.join(src, f))) fs.copyFileSync(path.join(src, f), path.join(OUT, "judge", f));
  }
}

const judgeChecks = results.judge.data?.checks || {};
const rows = CHECKS.map((id) => {
  const scores = MODEL_LABELS.map((label) => results[label]?.data?.checks?.[id]?.score ?? null);
  const confidences = MODEL_LABELS.map((label) => results[label]?.data?.checks?.[id]?.confidence ?? null);
  const judge = judgeChecks[id]?.score ?? null;
  const judgeConfidence = judgeChecks[id]?.confidence ?? null;
  const valid = scores.filter((n) => typeof n === "number");
  const spread = valid.length ? Math.max(...valid) - Math.min(...valid) : null;
  const confidenceSpread = new Set(confidences.filter(Boolean)).size;
  return {
    id,
    title: byId[id].title,
    max: byId[id].max,
    scores: Object.fromEntries(MODEL_LABELS.map((label, i) => [label, scores[i]])),
    confidences: Object.fromEntries(MODEL_LABELS.map((label, i) => [label, confidences[i]])),
    judge,
    judgeConfidence,
    spread,
    confidenceSpread,
    status: spread > 1 ? "ambiguous" : "ok",
  };
});

const ambiguous = rows.filter((r) => r.status === "ambiguous");
const disagreements = rows.filter((r) => MODEL_LABELS.some((label) => typeof r.scores[label] === "number" && r.scores[label] !== r.judge));
const exact = rows.filter((r) => MODEL_LABELS.every((label) => r.scores[label] === r.judge)).length;
const deltas = MODEL_LABELS.map((label) => {
  const vals = rows.map((r) => (typeof r.scores[label] === "number" && typeof r.judge === "number" ? Math.abs(r.scores[label] - r.judge) : null)).filter((n) => n !== null);
  return { label, meanDelta: vals.length ? Math.round((vals.reduce((s, n) => s + n, 0) / vals.length) * 100) / 100 : null };
});

const summary = {
  date: new Date().toISOString().slice(0, 10),
  snapshot: path.relative(process.cwd(), SNAPSHOT),
  checks: CHECKS,
  models: MODELS,
  judge: JUDGE,
  mock: MOCK,
  rows,
  ambiguous: ambiguous.map((r) => r.id),
  disagreements: disagreements.map((r) => r.id),
  confidenceDisagreements: rows.filter((r) => r.confidenceSpread > 1 || (r.judgeConfidence && Object.values(r.confidences).some((c) => c && c !== r.judgeConfidence))).map((r) => r.id),
  exact,
  deltas,
  failures: Object.entries(results).filter(([, r]) => !r.ok).map(([label, r]) => ({ label, error: r.error })),
  cost_note: "Judgment-only eval; no browsing. See references/model-matrix.md for prices.",
};
fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));

const md = [];
md.push(`# Cross-model eval — ${summary.date}`);
md.push("");
md.push(`**Snapshot:** \`${summary.snapshot}\``);
md.push(`**Models:** ${MODELS.map((m, i) => `${modelLabel(i)}=${m}`).join(" · ")}`);
md.push(`**Judge:** ${JUDGE}`);
md.push(`**Checks:** ${CHECKS.join(", ")}`);
md.push("");
md.push("## Agreement");
md.push("");
md.push(`| Check | ${MODEL_LABELS.join(" | ")} | Judge | Confidence spread | Status |`);
md.push(`|---|${MODEL_LABELS.map(() => "---").join("|")}|---|---|---|`);
for (const r of rows) {
  md.push(`| ${r.id} ${r.title} | ${MODEL_LABELS.map((l) => `${r.scores[l] ?? "—"} (${r.confidences[l] ?? "—"})`).join(" | ")} | ${r.judge ?? "—"} (${r.judgeConfidence ?? "—"}) | ${r.confidenceSpread} | ${r.status} |`);
}
md.push("");
md.push(`Exact agreement with judge: **${exact}/${CHECKS.length}** checks.`);
md.push("");
md.push("## Model deltas vs judge");
md.push("");
for (const d of deltas) md.push(`- Model ${d.label}: mean absolute delta ${d.meanDelta ?? "—"}`);
md.push("");
md.push("## Ambiguous checks");
md.push("");
if (!ambiguous.length) md.push("None. No check had a spread greater than 1.");
for (const r of ambiguous) {
  md.push(`- **${r.id} ${r.title}** — scores ${MODEL_LABELS.map((l) => `${l}=${r.scores[l]}`).join(", ")}; judge=${r.judge}. Tighten the anchor or add an example.`);
}
md.push("");
md.push("## Confidence disagreement");
md.push("");
if (!summary.confidenceDisagreements.length) md.push("None.");
else md.push(`Checks with a confidence-state mismatch: ${summary.confidenceDisagreements.join(", ")}. Re-read the evidence-state definitions before changing a score.`);
md.push("");
md.push("## Disagreements (1 point)");
md.push("");
const notes = disagreements.filter((r) => r.status !== "ambiguous");
if (!notes.length) md.push("None.");
for (const r of notes) {
  md.push(`- **${r.id} ${r.title}** — scores ${MODEL_LABELS.map((l) => `${l}=${r.scores[l]}`).join(", ")}; judge=${r.judge}. Note the model that diverged; do not change the rubric unless it repeats.`);
}
md.push("");
if (summary.failures.length) {
  md.push("## Failures");
  md.push("");
  for (const f of summary.failures) md.push(`- ${f.label}: ${f.error}`);
  md.push("");
}
md.push("## How to read this");
md.push("");
md.push("A spread of 1 is tolerable with a note. A spread greater than 1 means the rubric anchor is ambiguous, not that one model is wrong. Fix the anchor, then re-run.");
fs.writeFileSync(path.join(OUT, "report.md"), md.join("\n") + "\n");

console.log(JSON.stringify({ out: OUT, result: summary.failures.length ? "fail" : "pass", ambiguous: summary.ambiguous, exact, deltas, failures: summary.failures }, null, 2));
process.exit(summary.failures.length ? 1 : 0);
