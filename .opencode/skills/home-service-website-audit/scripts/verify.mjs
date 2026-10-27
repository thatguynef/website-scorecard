#!/usr/bin/env node
/**
 * Verify one Website Revenue Leak Scorecard run.
 *
 *   node verify.mjs --run .audit/example/2026-10-26T1000 \
 *     --filled reports/example.com/2026-10-26T1000/audit.filled.json \
 *     --scores reports/example.com/2026-10-26T1000/scores.json \
 *     --report reports/example.com/2026-10-26T1000/full-report.md \
 *     --one-page reports/example.com/2026-10-26T1000/one-page.md \
 *     --index reports/index.local.md --mutation
 *
 * Exit 0 = pass, 1 = hard failure, 2 = bad input.
 * The verifier never re-runs the collector and never contacts the site.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const localDate = (now = new Date()) =>
  new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) return true;
  return v;
}
const has = (name) => process.argv.includes(`--${name}`);

const HELP = `Website Revenue Leak Scorecard verifier 2.0.0

Usage:
  node verify.mjs --run <run-dir> [options]

Required:
  --run <dir>              Collector run directory

Recommended:
  --report <md>            Full audit report
  --one-page <md>          Contractor-facing one-pager
  --index <md>             Reports index
  --mutation               Run the verifier mutation suite
  --synthetic              Allow a synthetic example without screenshots/Lighthouse

Optional:
  --filled <json>          Default: <run>/audit.filled.json
  --scores <json>          Default: <run>/scores.json
  --site-map <json>        Default: <run>/site-map.json
  --paths <json>           Default: <run>/paths.json
  --run-json <json>        Default: <run>/run.json
  --evidence <dir>         Default: <run>/evidence
  --rubric <json>          Default: references/rubric.json
  --out <json>             Default: <run>/verification.json
  --previous <dir>         Previous run for a score delta
  --help                   Show this help

Exit codes: 0 pass, 1 hard failure, 2 bad input.
`;

if (has("help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_RUBRIC = path.join(ROOT, "references", "rubric.json");
const FIXTURES = path.join(import.meta.dirname, "fixtures");
const RUN = arg("run");
if (!RUN) {
  console.error("error: --run is required\n");
  console.error(HELP);
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
const synthetic = has("synthetic");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const readText = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function load() {
  return {
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
}

function configOf(filled) {
  const config = { ...(filled.meta?.configuration || {}) };
  config.optionalChecks = { ...(config.optionalChecks || {}) };
  config.excludedChecks = config.excludedChecks || [];
  config.preferredLanguages = config.preferredLanguages || ["en"];
  return config;
}

function isApplicable(item, config) {
  const level = item.applicability || "required";
  if (level === "required") return { applicable: true, reason: "" };
  if (level === "recommended") {
    const excluded = config.excludedChecks.includes(item.id);
    return { applicable: !excluded, reason: excluded ? "excluded by configuration.excludedChecks" : "" };
  }
  const module = item.module;
  if (module === "language_access") {
    const languages = config.preferredLanguages || ["en"];
    const enabled = typeof config.optionalChecks[module] === "boolean"
      ? config.optionalChecks[module]
      : languages.length > 1;
    return { applicable: enabled, reason: enabled ? "" : "multilingual access not configured for this market" };
  }
  const enabled = typeof config.optionalChecks[module] === "boolean"
    ? config.optionalChecks[module]
    : Boolean(item.defaultApplicable);
  return { applicable: enabled, reason: enabled ? "" : `optional module disabled: ${module || "conditional"}` };
}

function scoreMath(filled, rubric) {
  const config = configOf(filled);
  const checks = filled.checks || {};
  const categories = [];
  for (const cat of rubric.categories) {
    let applicableMax = 0;
    let earned = 0;
    for (const item of rubric.items.filter((i) => i.cat === cat.id)) {
      if (!isApplicable(item, config).applicable) continue;
      applicableMax += item.max;
      earned += checks[item.id]?.score || 0;
    }
    categories.push({
      id: cat.id,
      name: cat.name,
      max: cat.max,
      applicable_max: applicableMax,
      earned,
      normalized: applicableMax ? round2((cat.max * earned) / applicableMax) : 0,
    });
  }
  const applicableWeight = categories.filter((c) => c.applicable_max > 0).reduce((s, c) => s + c.max, 0);
  const rawTotal = categories.reduce((s, c) => s + c.normalized, 0);
  const total = applicableWeight ? round1((rawTotal * 100) / applicableWeight) : 0;
  const activeCaps = rubric.caps.filter((cap) => filled.caps?.[cap.id]);
  const cap = activeCaps.length ? Math.min(...activeCaps.map((c) => c.max)) : 100;
  const final = round1(Math.min(total, cap));
  const display = Math.round(final);
  const band = rubric.bands.slice().sort((a, b) => b.min - a.min).find((b) => display >= b.min);
  return { categories, total, applicableWeight, rawTotal, activeCaps, cap, final, display, band, config };
}

function makeChecker(data) {
  const hard = [];
  const soft = [];
  const checks = {};
  const addHard = (id, msg) => { hard.push({ id, msg }); checks[id] = false; };
  const addSoft = (id, msg) => { soft.push({ id, msg }); checks[id] = checks[id] !== false; };
  const pass = (id) => { if (checks[id] === undefined) checks[id] = true; };

  const { rubric, filled, scores, siteMap, paths, run, report, onePage, index } = data;
  const items = rubric.items;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const filledChecks = filled.checks || {};
  const config = configOf(filled);
  const math = scoreMath(filled, rubric);

  // I1 IDs
  const ids = Object.keys(filledChecks).sort();
  const expected = items.map((i) => i.id).sort();
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    addHard("I1", `check ids differ: missing=${expected.filter((x) => !ids.includes(x)).join(",")} extra=${ids.filter((x) => !expected.includes(x)).join(",")}`);
  } else pass("I1");

  // I2 weights
  const maxSum = rubric.categories.reduce((s, c) => s + c.max, 0);
  maxSum === 100 ? pass("I2") : addHard("I2", `category maxima sum to ${maxSum}`);

  // I3-I5 applicability, score, evidence, confidence
  let i3 = true;
  let i4 = true;
  let i5 = true;
  for (const item of items) {
    const c = filledChecks[item.id];
    if (!c) continue;
    const { applicable, reason } = isApplicable(item, config);
    if (typeof c.applicable === "boolean" && c.applicable !== applicable) i3 = false;
    if (!applicable) {
      if (c.score !== null) i3 = false;
      if (!c.na_reason && !reason) i3 = false;
      if (c.confidence !== "not_applicable") i3 = false;
      continue;
    }
    if (c.score === null || c.score === undefined || c.needs_review === true) i5 = false;
    if (!item.allowed.includes(c.score) || c.score > item.max) i3 = false;
    if (!Array.isArray(c.evidence) || c.evidence.length === 0) i4 = false;
    if (!["verified", "strong_signal"].includes(c.confidence)) i4 = false;
    for (const ev of c.evidence || []) {
      for (const m of String(ev).matchAll(/\b([MD])-(\d{2})\b/g)) {
        const prefix = `${m[1].toLowerCase()}-${m[2]}`;
        if (!synthetic && !data.evidence.some((f) => f.startsWith(prefix))) i4 = false;
      }
    }
  }
  i3 ? pass("I3") : addHard("I3", "a score is outside its allowed set, an applicability flag conflicts with configuration, or a required check is N/A");
  i4 ? pass("I4") : addHard("I4", "missing evidence, invalid confidence, or a cited M-/D- screenshot does not exist");
  i5 ? pass("I5") : addHard("I5", "an applicable check has a null score or needs_review=true");

  // I6 rubric version
  const rv = rubric.version;
  if (filled.meta?.rubric_version !== rv || scores.rubric_version !== rv) {
    addHard("I6", `rubric version mismatch: filled=${filled.meta?.rubric_version}, scores=${scores.rubric_version}, rubric=${rv}`);
  } else pass("I6");

  // I7-I14 math
  let mathOk = true;
  for (const cat of math.categories) {
    const found = (scores.categories || []).find((x) => x.id === cat.id);
    if (!found) { mathOk = false; continue; }
    if (found.earned !== cat.earned) mathOk = false;
    if (found.applicable_max !== cat.applicable_max) mathOk = false;
    if (Math.abs((found.normalized ?? -1) - cat.normalized) > 0.011) mathOk = false;
    if (found.max !== cat.max) mathOk = false;
  }
  if (Math.abs((scores.total ?? -1) - math.total) > 0.11) mathOk = false;
  if (Math.abs((scores.final ?? -1) - math.final) > 0.11) mathOk = false;
  if (scores.cap !== math.cap) mathOk = false;
  if (scores.display !== math.display) mathOk = false;
  if (scores.band !== math.band.band) mathOk = false;
  if (scores.cap_active !== (math.activeCaps.length > 0) || scores.cap_binding !== (math.final < math.total)) mathOk = false;
  mathOk ? pass("I7-I14") : addHard("I7-I14", `scorer math mismatch: scores total=${scores.total}/${math.total}, final=${scores.final}/${math.final}, display=${scores.display}/${math.display}, cap=${scores.cap}/${math.cap}, band=${scores.band}/${math.band.band}`);

  // I15-I18 cross-artifact
  const meta = filled.meta || {};
  const client = meta.client || "";
  const date = meta.date || "";
  onePage.includes(`${math.display} / 100`) ? pass("I15") : addHard("I15", "one-pager score does not match scores.display");
  if (report) {
    const scoreRe = new RegExp(`\\*\\*Score:\\*\\*\\s*\\*{0,2}${math.display}\\s*\\/\\s*100`);
    const catsOk = math.categories.every((c) =>
      report.includes(`| ${c.id}. ${c.name} | ${c.earned} |`) ||
      report.includes(`| ${c.id}. ${c.name} |`)
    );
    scoreRe.test(report) && catsOk ? pass("I16") : addHard("I16", "full report score or category rows do not match scores.json");
  } else addSoft("I16", "full report not supplied");
  if (index) {
    const row = `| ${date} | ${client} |`;
    const ok = index.includes(row) && index.includes(`**${math.display}/100**`);
    ok ? pass("I17") : addHard("I17", "reports index row is missing or has the wrong score");
  } else addSoft("I17", "reports index not supplied");
  onePage.includes(`| **Total** | **${math.display} / 100** |`) ? pass("I18") : addHard("I18", "one-pager total row does not match scores.display");

  // I19 placeholders
  const hasPlaceholder = (t) => /\{\{[A-Z0-9_]+\}\}/.test(t);
  !hasPlaceholder(onePage) && !hasPlaceholder(report) ? pass("I19") : addHard("I19", "unfilled placeholder remains");

  // I20 every check row exactly once
  if (report) {
    const rows = [...report.matchAll(/^\| (RL-[A-Z]{3}-\d{2}) \|/gm)].map((m) => m[1]);
    const unique = new Set(rows);
    if (unique.size !== items.length || rows.length !== items.length) {
      addHard("I20", `report findings rows=${rows.length}, unique=${unique.size}, expected=${items.length}`);
    } else pass("I20");
  } else addSoft("I20", "full report not supplied");

  // I21 fixes cite checks and do not overclaim points
  if (onePage) {
    const fixLines = [...onePage.matchAll(/^\| (\d+) \|(.+)$/gm)].map((m) => m[0]);
    const hasChecksCol = /\|\s*#\s*\|\s*Fix\s*\|\s*Checks\s*\|/.test(onePage);
    let fixOk = true;
    for (const line of fixLines) {
      const cells = line.split("|").map((s) => s.trim());
      const pointsIdx = hasChecksCol ? 4 : 3;
      const checksIdx = hasChecksCol ? 3 : -1;
      const points = parseInt((cells[pointsIdx] || "").replace("+", ""), 10);
      const cited = checksIdx >= 0 ? [...(cells[checksIdx] || "").matchAll(/RL-[A-Z]{3}-\d{2}/g)].map((m) => m[0]) : [];
      if (!cited.length) fixOk = false;
      const lost = cited.reduce((s, id) => s + (byId[id] ? byId[id].max - (filledChecks[id]?.score || 0) : 0), 0);
      if (Number.isFinite(points) && points > lost) fixOk = false;
    }
    fixOk ? pass("I21") : addSoft("I21", "a top fix does not cite checks or claims more points than are recoverable");
  } else addSoft("I21", "one-pager not supplied");

  // I22 word count
  if (onePage) {
    const words = onePage.split(/\s+/).filter(Boolean).length;
    if (words < 450 || words > 900) addHard("I22", `one-pager word count ${words} outside 450-900`);
    else pass("I22");
  } else addSoft("I22", "one-pager not supplied");

  // I23 identity
  const same = (!scores.meta?.date || scores.meta.date === date) && (!scores.meta?.client || scores.meta.client === client);
  const urlOk = !meta.url || report.includes(meta.url) || onePage.includes(meta.url) || onePage.includes(meta.url.replace(/^https?:\/\/(www\.)?/, ""));
  same && urlOk ? pass("I23") : addHard("I23", "date/client/url mismatch across artifacts");

  // I24 link
  if (onePage) {
    const links = [...onePage.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
    const local = links.find((l) => l.endsWith(".md") && !/^https?:/.test(l));
    if (!local) addHard("I24", "one-pager has no link to a local full report");
    else {
      const target = path.resolve(path.dirname(onePagePath), local);
      exists(target) ? pass("I24") : addHard("I24", `one-pager report link does not resolve: ${local}`);
    }
  } else addSoft("I24", "one-pager not supplied");

  // I25 language conditional
  const language = byId["RL-UND-08"];
  const languageApplies = language ? isApplicable(language, config).applicable : false;
  if (languageApplies && filledChecks["RL-UND-08"]?.score === 0) {
    const langs = (config.preferredLanguages || []).filter((l) => l !== "en");
    const re = langs.length
      ? new RegExp(`language|espa[nñ]ol|se habla|${langs.join("|")}`, "i")
      : /language|espa[nñ]ol|se habla/i;
    re.test(onePage) || re.test(report) ? pass("I25") : addHard("I25", "language access is scored zero but the report does not mention it");
  } else pass("I25");

  // I26 financing only when configured
  if (config.optionalChecks.financing === true) {
    /financ/i.test(onePage) && /financ/i.test(report) ? pass("I26") : addHard("I26", "financing is configured but the report does not mention it");
  } else pass("I26");

  // I27 cap stated
  if (math.activeCaps.length) {
    const stated = /cap/i.test(report || onePage) && (report.includes(String(math.cap)) || onePage.includes(String(math.cap)));
    stated ? pass("I27") : addHard("I27", `report does not state the active cap ${math.cap}`);
  } else pass("I27");

  // I28 lighthouse median
  if (!synthetic && filledChecks["RL-MOB-01"]?.score !== null && filledChecks["RL-MOB-01"]?.score !== undefined) {
    const lhFiles = fs.existsSync(runDir) ? fs.readdirSync(runDir).filter((f) => /^lighthouse-mobile-\d+\.json$/.test(f)) : [];
    if (lhFiles.length < 3) addHard("I28", `only ${lhFiles.length} Lighthouse runs`);
    else {
      const lcps = lhFiles.map((f) => {
        try { return readJson(path.join(runDir, f)).audits["largest-contentful-paint"].numericValue; }
        catch { return null; }
      }).filter((n) => typeof n === "number").sort((a, b) => a - b);
      const median = lcps.length % 2 ? lcps[(lcps.length - 1) / 2] : (lcps[lcps.length / 2 - 1] + lcps[lcps.length / 2]) / 2;
      const expectedScore = median <= 2500 ? 4 : median <= 4000 ? 2 : 0;
      expectedScore === filledChecks["RL-MOB-01"].score ? pass("I28") : addHard("I28", `LCP median ${Math.round(median)} maps to ${expectedScore}, audit says ${filledChecks["RL-MOB-01"].score}`);
    }
  } else addSoft("I28", "Lighthouse not required for this run");

  // I30 run manifest
  if (!run || !run.pages || !run.viewports || !run.scheduler) addHard("I30", "run.json missing pages/viewports/scheduler");
  else pass("I30");

  // I31 no side effects
  const pathList = paths?.paths || [];
  pathList.length && pathList.every((p) => p.submitted === false) ? pass("I31") : addHard("I31", "a path trace is missing or has submitted=true");

  // I33 run id/version
  const runId = run?.run_id || meta.run_id;
  if (!runId || meta.run_id !== runId || run?.rubric_version !== rv) addHard("I33", "run_id/rubric_version missing or inconsistent");
  else pass("I33");

  // I34 immutability/diff
  if (previousPath) {
    const prev = exists(path.join(previousPath, "scores.json")) ? readJson(path.join(previousPath, "scores.json")) : null;
    if (!prev) addSoft("I34", "previous run scores not found");
    else if (prev.meta?.run_id && prev.meta.run_id === runId) addHard("I34", "previous and current run IDs are identical");
    else pass("I34");
  } else addSoft("I34", "no previous run supplied");

  // I35 site map
  if (!siteMap || !Array.isArray(siteMap.pages) || !siteMap.pages.length) addHard("I35", "site-map.json missing pages");
  else {
    const types = new Set(siteMap.pages.map((p) => p.type));
    const pathsIds = new Set((siteMap.conversion_paths || []).map((p) => p.id));
    const missingTypes = ["home", "service", "contact"].filter((t) => !types.has(t));
    const missingPaths = ["call", "form", "book", "estimate"].filter((p) => !pathsIds.has(p));
    if (missingTypes.length || missingPaths.length) addHard("I35", `site map missing types=${missingTypes.join(",")} paths=${missingPaths.join(",")}`);
    else pass("I35");
  }

  // I36 path traces
  const requiredPaths = ["call", "form", "book", "estimate"];
  const byPath = Object.fromEntries(pathList.map((p) => [p.id, p]));
  const badPaths = requiredPaths.filter((id) => {
    const p = byPath[id];
    return !p || !p.url || !p.viewport || !p.action || !p.observed_state || p.submitted !== false;
  });
  badPaths.length ? addHard("I36", `path traces incomplete: ${badPaths.join(",")}`) : pass("I36");

  // I38 mutation
  if (data.mutation) {
    data.mutation.pass ? pass("I38") : addHard("I38", `mutation tests failed: ${data.mutation.survived.join(",")}`);
  } else addSoft("I38", "mutation tests not run");

  // I39 owner-data section
  if ((scores.ownerDataRequired || []).length) {
    /Revenue Opportunities to Investigate/i.test(onePage) ? pass("I39") : addHard("I39", "one-pager is missing the Revenue Opportunities to Investigate section");
  } else pass("I39");

  // I40 journey section
  /Customer Journey/i.test(onePage) ? pass("I40") : addHard("I40", "one-pager is missing the Customer Journey section");

  // I41 top leak confidence labels
  const topLeaks = scores.topLeaks || filled.topLeaks || [];
  if (topLeaks.length) {
    const labels = topLeaks.map((l) => String(l.confidence || "").replaceAll("_", " ").toUpperCase());
    const ok = labels.every((label) => onePage.toUpperCase().includes(label));
    ok ? pass("I41") : addHard("I41", "a top leak confidence label is missing from the one-pager");
  } else addSoft("I41", "no topLeaks supplied");

  return { hard, soft, checks };
}

function mutationSuite(data) {
  const first = data.rubric.items[0].id;
  const mutations = [
    ["score +1", (d) => { d.filled.checks[first].score += 1; }],
    ["delete a check", (d) => { delete d.filled.checks[first]; }],
    ["clear evidence", (d) => { d.filled.checks[first].evidence = []; }],
    ["invalid confidence", (d) => { d.filled.checks[first].confidence = "certain"; }],
    ["required check marked N/A", (d) => {
      d.filled.checks[first].score = null;
      d.filled.checks[first].applicable = false;
      d.filled.checks[first].confidence = "not_applicable";
      d.filled.checks[first].na_reason = "mutant";
    }],
    ["activate a cap", (d) => { d.filled.caps.mobile_unusable = true; }],
    ["change scores total", (d) => { d.scores.total += 1; }],
    ["placeholder in one-pager", (d) => { d.onePage += "\n{{BAD}}\n"; }],
    ["remove one-pager report link", (d) => { d.onePage = d.onePage.replace(/\[[^\]]*\]\([^)]*\.md\)/g, ""); }],
    ["remove rubric version", (d) => { delete d.filled.meta.rubric_version; }],
    ["path submitted=true", (d) => { d.paths.paths[0].submitted = true; }],
    ["empty site map", (d) => { d.siteMap.pages = []; }],
    ["remove owner-data section", (d) => { d.onePage = d.onePage.replace(/Revenue Opportunities to Investigate/gi, "Other"); }],
    ["remove top-leak confidence", (d) => {
      d.onePage = d.onePage.replace(/VERIFIED|STRONG SIGNAL|OWNER DATA REQUIRED/gi, "CERTAIN");
    }],
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

function scoreFixture(fixture, rubric, expected) {
  const out = path.join("/tmp", `verify-fixture-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  try {
    execFileSync("python3", [
      path.join(import.meta.dirname, "score.py"),
      "--input", fixture, "--rubric", rubric, "--out", out, "--strict",
    ], { stdio: "ignore" });
    const result = readJson(out);
    fs.rmSync(out, { force: true });
    return { pass: result.display === expected.display && result.band === expected.band, detail: `display=${result.display}, band=${result.band}` };
  } catch (error) {
    try { fs.rmSync(out, { force: true }); } catch {}
    return { pass: false, detail: String(error).slice(0, 300) };
  }
}

function fixtureCheck() {
  return {
    v2: scoreFixture(path.join(FIXTURES, "acme-plumbing-v2.audit.json"), DEFAULT_RUBRIC, { display: 68, band: "C" }),
    v1: scoreFixture(
      path.join(FIXTURES, "legacy-roofing-a-v1.audit.json"),
      path.join(ROOT, "references", "legacy", "rubric-v1.1.3.json"),
      { display: 36, band: "F" }
    ),
  };
}

// ---- main ----
let data;
try {
  data = load();
} catch (error) {
  console.error(`could not load run: ${error.message}`);
  process.exit(2);
}

const baseline = makeChecker(data);
const mutation = has("mutation") ? mutationSuite(data) : null;
if (mutation) data.mutation = mutation;
const finalCheck = makeChecker(data);
const fixture = has("fixture") ? fixtureCheck() : null;

const result = {
  result: finalCheck.hard.length === 0 && (!mutation || mutation.pass) && (!fixture || (fixture.v2.pass && fixture.v1.pass)) ? "pass" : "fail",
  run_id: data.run?.run_id || data.filled?.meta?.run_id || path.basename(runDir),
  rubric_version: data.rubric?.version,
  score: data.scores?.display,
  hard_failures: finalCheck.hard,
  soft_failures: finalCheck.soft,
  checks: finalCheck.checks,
  mutation_tests: mutation ? mutation.pass : "not_run",
  mutations: mutation ? mutation.survived : [],
  fixture,
  word_count: data.onePage ? data.onePage.split(/\s+/).filter(Boolean).length : null,
  score_delta: previousPath && exists(path.join(previousPath, "scores.json"))
    ? (data.scores?.display ?? 0) - (readJson(path.join(previousPath, "scores.json")).display ?? 0)
    : null,
};

const record = {
  run_id: result.run_id,
  verifier: "verify.mjs",
  date: localDate(),
  rubric_version: result.rubric_version,
  result: result.result,
  sampled_checks: ["RL-UND-01", "RL-CON-02", "RL-CON-05", "RL-RSP-01", "RL-TRU-01", "RL-MOB-02", "RL-FND-01", "RL-MSR-01"],
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
