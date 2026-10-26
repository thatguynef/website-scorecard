#!/usr/bin/env node
/**
 * Verify one audit run against the output spec.
 *
 *   node verify.mjs --run .audit/example/2026-10-24T1812 \
 *     --report audit-example.md \
 *     --one-page reports/example-2026-10-24-one-page.md \
 *     --index reports/index.local.md \
 *     --mutation
 *
 * Exit 0 = pass, 1 = hard failure, 2 = bad input.
 * The verifier never re-runs the collector.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) return true;
  return v;
}

const has = (name) => process.argv.includes(`--${name}`);

if (has("help") || process.argv.includes("-h")) {
  console.log(`Legacy V1 verifier (historical runs)

Usage:
  node legacy/verify-v1.mjs --run <run-dir> [options]

Options:
  --run <dir>          V1 run directory
  --report <md>        Full V1 report
  --one-page <md>      V1 one-pager
  --index <md>         Reports index
  --mutation           V1 mutation suite
  --fixture            Check the sanitized V1 golden fixture
  --previous <dir>     Previous run for a score delta
  --help               Show this help

V1 is preserved for historical reproducibility. New audits use verify.mjs.`);
  process.exit(0);
}

const SKILL_ROOT = path.resolve(import.meta.dirname, "..", "..");
const DEFAULT_RUBRIC = path.join(SKILL_ROOT, "references", "legacy", "rubric-v1.1.3.json");
const FIXTURES = path.join(SKILL_ROOT, "scripts", "fixtures");

const RUN = arg("run");
if (!RUN) {
  console.error("usage: verify.mjs --run <run-dir> [--report ...] [--one-page ...] [--index ...] [--mutation] [--fixture]");
  process.exit(2);
}

const runDir = path.resolve(RUN);
const filledPath = path.resolve(arg("filled", path.join(runDir, "audit.filled.json")));
const scoresPath = path.resolve(arg("scores", path.join(runDir, "scores.json")));
const siteMapPath = path.resolve(arg("site-map", path.join(runDir, "site-map.json")));
const pathsPath = path.resolve(arg("paths", path.join(runDir, "paths.json")));
const runJsonPath = path.resolve(arg("run-json", path.join(runDir, "run.json")));
const evidenceDir = path.resolve(arg("evidence", path.join(runDir, "evidence")));
const rubricPath = path.resolve(arg("rubric", DEFAULT_RUBRIC));
const reportPath = arg("report") ? path.resolve(arg("report")) : null;
const onePagePath = arg("one-page") ? path.resolve(arg("one-page")) : null;
const indexPath = arg("index") ? path.resolve(arg("index")) : null;
const previousPath = arg("previous") ? path.resolve(arg("previous")) : null;
const outPath = path.resolve(arg("out", path.join(runDir, "verification.json")));
const verifierName = arg("verifier", "verify.mjs");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const readText = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);

function load() {
  const data = {
    rubric: readJson(rubricPath),
    filled: readJson(filledPath),
    scores: readJson(scoresPath),
    siteMap: exists(siteMapPath) ? readJson(siteMapPath) : null,
    paths: exists(pathsPath) ? readJson(pathsPath) : null,
    run: exists(runJsonPath) ? readJson(runJsonPath) : null,
    report: reportPath && exists(reportPath) ? readText(reportPath) : "",
    onePage: onePagePath && exists(onePagePath) ? readText(onePagePath) : "",
    index: indexPath && exists(indexPath) ? readText(indexPath) : "",
    evidence: exists(evidenceDir) ? fs.readdirSync(evidenceDir) : [],
  };
  return data;
}

function makeChecker(data) {
  const hard = [];
  const soft = [];
  const checks = {};
  const addHard = (id, msg) => { hard.push({ id, msg }); checks[id] = false; };
  const addSoft = (id, msg) => { soft.push({ id, msg }); checks[id] = checks[id] !== false; };
  const pass = (id) => { if (checks[id] === undefined) checks[id] = true; };

  const rubric = data.rubric;
  const filled = data.filled;
  const scores = data.scores;
  const items = rubric.items;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const filledChecks = filled.checks || {};

  // I1
  const ids = Object.keys(filledChecks).sort();
  const expected = items.map((i) => i.id).sort();
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    addHard("I1", `check ids differ: missing=${expected.filter((x) => !ids.includes(x)).join(",")} extra=${ids.filter((x) => !expected.includes(x)).join(",")}`);
  } else pass("I1");

  // I2
  const maxSum = rubric.categories.reduce((s, c) => s + c.max, 0);
  maxSum === 100 ? pass("I2") : addHard("I2", `category maxima sum to ${maxSum}`);

  // I3 + I4 + I5
  let i3 = true, i4 = true, i5 = true;
  for (const item of items) {
    const c = filledChecks[item.id];
    if (!c) continue;
    if (c.score === null || c.score === undefined || c.needs_review === true) i5 = false;
    if (item.split) {
      const subs = c.subscores || {};
      const sum = Object.values(subs).reduce((s, n) => s + n, 0);
      for (const [vp, max] of Object.entries(item.split)) {
        if (subs[vp] === undefined || !item.allowed[vp].includes(subs[vp]) || subs[vp] > max) i3 = false;
      }
      if (sum !== c.score) i3 = false;
    } else if (!item.allowed.includes(c.score)) i3 = false;
    if (!Array.isArray(c.evidence) || c.evidence.length === 0) i4 = false;
    for (const ev of c.evidence || []) {
      for (const m of String(ev).matchAll(/\b([MD])-(\d{2})\b/g)) {
        const prefix = `${m[1].toLowerCase()}-${m[2]}`;
        if (!data.evidence.some((f) => f.startsWith(prefix))) i4 = false;
      }
    }
  }
  i3 ? pass("I3") : addHard("I3", "a score is outside its allowed set or A7 split is invalid");
  i4 ? pass("I4") : addHard("I4", "missing evidence or a cited M-/D- screenshot does not exist");
  i5 ? pass("I5") : addHard("I5", "null score, needs_review=true, or empty evidence");

  // I6
  const rv = rubric.version;
  if (filled?.meta?.rubric_version !== rv || scores?.rubric_version !== rv) {
    addHard("I6", `rubric version mismatch: filled=${filled?.meta?.rubric_version}, scores=${scores?.rubric_version}, rubric=${rv}`);
  } else pass("I6");

  // I7-I14 recompute
  const cats = Object.fromEntries(rubric.categories.map((c) => [c.id, 0]));
  for (const item of items) cats[item.cat] += filledChecks[item.id]?.score || 0;
  const total = Object.values(cats).reduce((s, n) => s + n, 0);
  const activeCaps = rubric.caps.filter((c) => filled.caps?.[c.id]);
  const cap = activeCaps.length ? Math.min(...activeCaps.map((c) => c.max)) : 100;
  const final = Math.min(total, cap);
  const band = rubric.bands.slice().sort((a, b) => b.min - a.min).find((b) => final >= b.min);
  const percent = Math.round((100 * final) / rubric.total * 10) / 10;

  let mathOk = true;
  for (const c of rubric.categories) {
    const found = (scores.categories || []).find((x) => x.id === c.id);
    if (!found || found.earned !== cats[c.id] || found.max !== c.max) mathOk = false;
  }
  if (scores.total !== total || scores.final !== final || scores.cap !== cap || scores.band !== band.band) mathOk = false;
  if (Math.abs((scores.percent ?? -1) - percent) > 0.05) mathOk = false;
  if (scores.cap_active !== (activeCaps.length > 0) || scores.cap_binding !== (final < total)) mathOk = false;
  mathOk ? pass("I7-I14") : addHard("I7-I14", `scorer math mismatch: total=${scores.total}/${total}, final=${scores.final}/${final}, cap=${scores.cap}/${cap}, band=${scores.band}/${band.band}`);

  // I15-I18 cross-artifact
  const one = data.onePage;
  const report = data.report;
  const idx = data.index;
  const meta = filled.meta || {};
  const client = meta.client || "";
  const date = meta.date || "";

  one.includes(`${final} / 100`) ? pass("I15") : addHard("I15", "one-pager score does not match scores.final");
  if (report) {
    const scoreRe = new RegExp(`Score:\\*\\*\\s*\\*{0,2}${final}\\s*\\/\\s*100`);
    const catsOk = rubric.categories.every((c) => {
      const re = new RegExp(`\\| ${c.id}\\. ${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| ${cats[c.id]} \\| ${c.max} \\|`);
      return re.test(report);
    });
    scoreRe.test(report) && catsOk ? pass("I16") : addHard("I16", "full report score or category rows do not match scores.json");
  } else addSoft("I16", "full report not supplied");
  if (idx) {
    const row = `| ${date} | ${client} |`;
    const ok = idx.includes(row) && idx.includes(`**${final}/100**`);
    ok ? pass("I17") : addHard("I17", "reports index row is missing or has the wrong score");
  } else addSoft("I17", "reports index not supplied");
  one.includes(`| **Total** | **${final} / 100** |`) ? pass("I18") : addHard("I18", "one-pager total row does not match scores.final");

  // I19 placeholders
  const hasPlaceholder = (t) => /\{\{[A-Z0-9_]+\}\}/.test(t);
  !hasPlaceholder(one) && !hasPlaceholder(report) ? pass("I19") : addHard("I19", "unfilled placeholder remains");

  // I20 report findings rows
  if (report) {
    const rows = [...report.matchAll(/^\| ([A-G]\d) \|/gm)].map((m) => m[1]);
    const unique = new Set(rows);
    if (unique.size !== 42 || rows.length !== 42) addHard("I20", `report findings rows=${rows.length}, unique=${unique.size}`);
    else pass("I20");
  } else addSoft("I20", "full report not supplied");

  // I21 fix -> checks
  if (one) {
    const fixLines = [...one.matchAll(/^\| (\d+) \|(.+)$/gm)].map((m) => m[0]);
    const hasChecksCol = /\|\s*#\s*\|\s*Fix\s*\|\s*Checks\s*\|/.test(one);
    let fixOk = fixLines.length > 0;
    for (const line of fixLines) {
      const cells = line.split("|").map((s) => s.trim());
      const pointsIdx = hasChecksCol ? 4 : 3;
      const checksIdx = hasChecksCol ? 3 : -1;
      const points = parseInt((cells[pointsIdx] || "").replace("+", ""), 10);
      const cited = checksIdx >= 0 ? [...(cells[checksIdx] || "").matchAll(/[A-G]\d/g)].map((m) => m[0]) : [];
      if (!cited.length) fixOk = false;
      const lost = cited.reduce((s, id) => s + (byId[id] ? byId[id].max - (filledChecks[id]?.score || 0) : 0), 0);
      if (Number.isFinite(points) && points > lost) fixOk = false;
    }
    fixOk ? pass("I21") : addSoft("I21", "a top-five fix does not cite checks or claims more points than are recoverable");
  } else addSoft("I21", "one-pager not supplied");

  // I22 words
  if (one) {
    const words = one.split(/\s+/).filter(Boolean).length;
    if (words < 500 || words > 750) addHard("I22", `one-pager word count ${words} outside 500-750`);
    else pass("I22");
  } else addSoft("I22", "one-pager not supplied");

  // I23 identity
  const same = (!scores.meta?.date || scores.meta.date === date) && (!scores.meta?.client || scores.meta.client === client);
  const urlOk = !meta.url || report.includes(meta.url) || one.includes(meta.url) || one.includes(meta.url.replace(/^https?:\/\/(www\.)?/, ""));
  same && urlOk ? pass("I23") : addHard("I23", "date/client/url mismatch across artifacts");

  // I24 link
  if (one) {
    const links = [...one.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
    const auditLink = links.find((l) => /audit-.*\.md/.test(l));
    if (!auditLink) addHard("I24", "one-pager has no link to the full audit");
    else {
      const target = path.resolve(path.dirname(onePagePath), auditLink);
      exists(target) ? pass("I24") : addHard("I24", `one-pager audit link does not resolve: ${auditLink}`);
    }
  } else addSoft("I24", "one-pager not supplied");

  // I25 Spanish
  if (filledChecks.A7?.score === 0) {
    one.includes("0 / 4") && /Español|Se habla/i.test(one) ? pass("I25") : addHard("I25", "A7=0 but one-pager lacks 0/4 or Español");
  } else pass("I25");

  // I26 financing
  const fin = (filledChecks.B6?.score || 0) + (filledChecks.D5?.score || 0);
  if (fin <= 2) {
    const heading = /^## .*Financ/im.test(report);
    const mention = /financ/i.test(one);
    heading && mention ? pass("I26") : addHard("I26", "financing is low but the report section or one-pager mention is missing");
  } else pass("I26");

  // I27 cap stated
  if (activeCaps.length) {
    const stated = /cap/i.test(report) && report.includes(String(cap));
    stated ? pass("I27") : addHard("I27", `report does not state the active cap ${cap}`);
  } else pass("I27");

  // I28 lighthouse median
  if (filledChecks.E1?.score !== null && filledChecks.E1?.score !== undefined) {
    const lhFiles = fs.existsSync(runDir) ? fs.readdirSync(runDir).filter((f) => /^lighthouse-mobile-\d+\.json$/.test(f)) : [];
    if (lhFiles.length < 3) addHard("I28", `only ${lhFiles.length} Lighthouse runs`);
    else {
      const lcps = lhFiles.map((f) => {
        try { return readJson(path.join(runDir, f)).audits["largest-contentful-paint"].numericValue; }
        catch { return null; }
      }).filter((n) => typeof n === "number").sort((a, b) => a - b);
      const median = lcps.length % 2 ? lcps[(lcps.length - 1) / 2] : (lcps[lcps.length / 2 - 1] + lcps[lcps.length / 2]) / 2;
      const expectedScore = median <= 2500 ? 4 : median <= 4000 ? 2 : 0;
      expectedScore === filledChecks.E1.score ? pass("I28") : addHard("I28", `LCP median ${Math.round(median)} maps to ${expectedScore}, audit says ${filledChecks.E1.score}`);
    }
  } else addSoft("I28", "E1 not scored");

  // I30 run manifest
  const rj = data.run;
  if (!rj || !rj.pages || !rj.viewports || !rj.scheduler) addHard("I30", "run.json missing pages/viewports/lighthouse/scheduler");
  else pass("I30");

  // I31 side effects
  const paths = (data.paths?.paths) || [];
  paths.every((p) => p.submitted === false) ? pass("I31") : addHard("I31", "a path trace has submitted=true");

  // I33 run id/version
  const runId = rj?.run_id || meta.run_id;
  if (!runId || meta.run_id !== runId || rj?.rubric_version !== rv) addHard("I33", "run_id/rubric_version missing or inconsistent");
  else pass("I33");

  // I34 immutability/diff
  if (previousPath) {
    const prev = exists(path.join(previousPath, "scores.json")) ? readJson(path.join(previousPath, "scores.json")) : null;
    if (!prev) addSoft("I34", "previous run scores not found");
    else if (prev.meta?.run_id && prev.meta.run_id === runId) addHard("I34", "previous and current run IDs are identical");
    else pass("I34");
  } else addSoft("I34", "no previous run supplied");

  // I35 site map
  const sm = data.siteMap;
  if (!sm || !Array.isArray(sm.pages) || !sm.pages.length) addHard("I35", "site-map.json missing pages");
  else {
    const types = new Set(sm.pages.map((p) => p.type));
    const pathsIds = new Set((sm.conversion_paths || []).map((p) => p.id));
    const requiredTypes = ["home", "service", "contact"];
    const missingTypes = requiredTypes.filter((t) => !types.has(t));
    const requiredPaths = ["call", "text", "form", "book", "financing", "reviews"];
    const missingPaths = requiredPaths.filter((p) => !pathsIds.has(p));
    if (missingTypes.length || missingPaths.length) addHard("I35", `site map missing types=${missingTypes.join(",")} paths=${missingPaths.join(",")}`);
    else pass("I35");
  }

  // I36 path traces
  const reqPaths = ["call", "text", "form", "book", "financing", "reviews"];
  const byPath = Object.fromEntries(paths.map((p) => [p.id, p]));
  const badPaths = reqPaths.filter((id) => {
    const p = byPath[id];
    return !p || !p.url || !p.viewport || !p.action || !p.observed_state || p.submitted !== false;
  });
  badPaths.length ? addHard("I36", `path traces incomplete: ${badPaths.join(",")}`) : pass("I36");

  // I38 mutation result is attached by the caller
  if (data.mutation) {
    data.mutation.pass ? pass("I38") : addHard("I38", `mutation tests failed: ${data.mutation.survived.join(",")}`);
  } else addSoft("I38", "mutation tests not run");

  return { hard, soft, checks };
}

function mutationSuite(data) {
  const mutations = [
    ["score +1", (d) => { d.filled.checks.A1.score += 1; }],
    ["delete A1", (d) => { delete d.filled.checks.A1; }],
    ["clear A1 evidence", (d) => { d.filled.checks.A1.evidence = []; }],
    ["activate no-contact cap", (d) => { d.filled.caps.no_contact = true; }],
    ["change scores total", (d) => { d.scores.total += 1; }],
    ["placeholder in one-pager", (d) => { d.onePage += "\n{{BAD}}\n"; }],
    ["remove one-pager audit link", (d) => { d.onePage = d.onePage.replace(/\[[^\]]*\]\([^)]*audit-[^)]*\)/g, ""); }],
    ["remove rubric version", (d) => { delete d.filled.meta.rubric_version; }],
    ["path submitted=true", (d) => { d.paths.paths[0].submitted = true; }],
    ["empty site map", (d) => { d.siteMap.pages = []; }],
  ];
  const survived = [];
  for (const [name, apply] of mutations) {
    const clone = JSON.parse(JSON.stringify(data));
    apply(clone);
    const result = makeChecker(clone);
    if (result.hard.length === 0) survived.push(name);
  }
  return { pass: survived.length === 0, total: mutations.length, survived };
}

function fixtureCheck() {
  const fixture = path.join(FIXTURES, "legacy-roofing-a-v1.audit.json");
  if (!exists(fixture)) return { pass: false, detail: "fixture missing" };
  const out = path.join("/tmp", `verify-fixture-${Date.now()}.json`);
  try {
    execFileSync("python3", [
      path.join(import.meta.dirname, "..", "score.py"),
      "--input", fixture, "--rubric", DEFAULT_RUBRIC, "--out", out, "--strict",
    ], { stdio: "ignore" });
    const result = readJson(out);
    return { pass: result.final === 36 && result.band === "F", detail: `final=${result.final}, band=${result.band}` };
  } catch (e) {
    return { pass: false, detail: String(e).slice(0, 200) };
  }
}

// ---- main ----
let data;
try {
  data = load();
} catch (e) {
  console.error(`could not load run: ${e.message}`);
  process.exit(2);
}

const baseline = makeChecker(data);
const mutation = has("mutation") ? mutationSuite(data) : null;
if (mutation) data.mutation = mutation;
const finalCheck = makeChecker(data);
const fixture = has("fixture") ? fixtureCheck() : null;

const result = {
  result: finalCheck.hard.length === 0 && (!mutation || mutation.pass) && (!fixture || fixture.pass) ? "pass" : "fail",
  run_id: data.run?.run_id || data.filled?.meta?.run_id || path.basename(runDir),
  rubric_version: data.rubric?.version,
  score: data.scores?.final,
  hard_failures: finalCheck.hard,
  soft_failures: finalCheck.soft,
  checks: finalCheck.checks,
  mutation_tests: mutation ? mutation.pass : "not_run",
  mutations: mutation ? mutation.survived : [],
  fixture,
  word_count: data.onePage ? data.onePage.split(/\s+/).filter(Boolean).length : null,
  score_delta: previousPath && exists(path.join(previousPath, "scores.json"))
    ? (data.scores?.final ?? 0) - (readJson(path.join(previousPath, "scores.json")).final ?? 0)
    : null,
};

const record = {
  run_id: result.run_id,
  verifier: verifierName,
  date: new Date().toISOString().slice(0, 10),
  rubric_version: result.rubric_version,
  result: result.result,
  sampled_checks: ["A1", "A7", "B6", "C1", "D1", "E2", "F1"],
  overrides: [],
  site_map: exists(siteMapPath) ? "site-map.json" : null,
  path_traces: exists(pathsPath) ? "paths.json" : null,
  mutation_tests: mutation ? (mutation.pass ? "pass" : "fail") : "not_run",
  hard_failures: finalCheck.hard,
  soft_failures: finalCheck.soft,
  waivers: [],
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(record, null, 2));

console.log(JSON.stringify(result, null, 2));
process.exit(result.result === "pass" ? 0 : 1);
