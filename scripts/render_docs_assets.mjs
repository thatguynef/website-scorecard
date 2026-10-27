#!/usr/bin/env node
/**
 * Render the documentation PNGs from the synthetic example.
 *
 * Reads examples/acme-plumbing/scores.json and content.json, builds a
 * self-contained HTML card, and screenshots it with Chrome. The output is
 * synthetic only; never point this at a real report.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXAMPLE = path.join(ROOT, "examples", "acme-plumbing");
const OUT = path.join(ROOT, "docs", "assets");
const LOGO_URL = pathToFileURL(path.join(OUT, "logo.svg")).href;
const HELP = `Website Scorecard — documentation asset renderer

Usage:
  node scripts/render_docs_assets.mjs [--help]

Renders docs/assets/scorecard-preview.png and docs/assets/social-preview.png
from the synthetic Acme Plumbing example. Requires Google Chrome or Chromium.
Set CHROME_PATH to override the browser location.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) fail("Chrome/Chromium not found. Set CHROME_PATH.");
  return found;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const scores = JSON.parse(fs.readFileSync(path.join(EXAMPLE, "scores.json"), "utf8"));
const content = JSON.parse(fs.readFileSync(path.join(EXAMPLE, "content.json"), "utf8"));

if (!content.client?.toLowerCase().includes("synthetic")) {
  fail("the example content is not labeled synthetic; refusing to render");
}

const CONFIDENCE = {
  verified: ["VERIFIED", "verified"],
  strong_signal: ["STRONG SIGNAL", "strong"],
  owner_data_required: ["OWNER DATA REQUIRED", "owner"],
  not_applicable: ["NOT APPLICABLE", "owner"],
};

const leaks = content.leaks ?? [];
const counts = {
  verified: leaks.filter((leak) => leak.confidence === "verified").length,
  strong: leaks.filter((leak) => leak.confidence === "strong_signal").length,
  owner: leaks.filter((leak) => leak.confidence === "owner_data_required").length,
};

const fontLinks = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">`;

const base = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { overflow: hidden; background: #0B0B0C; }
  body {
    font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #F7F7F5;
  }
  .page {
    background:
      linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 40px 40px,
      linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 40px 40px,
      radial-gradient(900px 520px at 86% -6%, rgba(255,59,59,.16), transparent 70%),
      #0B0B0C;
  }
  .mono { font-family: "IBM Plex Mono", ui-monospace, monospace; }
  .display { font-family: "Space Grotesk", "Inter", system-ui, sans-serif; }
  .card {
    background: #101012;
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px;
    box-shadow: 0 30px 80px rgba(0,0,0,.45);
  }
  .chip {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 8.5px;
    letter-spacing: 1.4px;
    padding: 5px 9px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .verified { color: #3FBF7F; background: rgba(63,191,127,.10); border: 1px solid rgba(63,191,127,.28); }
  .strong { color: #F5C766; background: rgba(245,199,102,.10); border: 1px solid rgba(245,199,102,.28); }
  .owner { color: #B4B4BA; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.13); }
  .label {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 9.5px;
    letter-spacing: 2.2px;
    color: #FF3B3B;
  }
`;

const previewHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Website Scorecard — synthetic sample report</title>
${fontLinks}
<style>
  ${base}
  html, body { width: 1200px; height: 1000px; }
  .page { width: 1200px; height: 1000px; padding: 40px; }
  .card { width: 1120px; height: 920px; padding: 44px 48px; display: flex; flex-direction: column; }
  .top { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 11px; }
  .brand img { width: 26px; height: 26px; }
  .brand span { font-family: "IBM Plex Mono", monospace; font-size: 9.5px; letter-spacing: 2.3px; color: #A6A6AA; }
  .badge {
    font-family: "IBM Plex Mono", monospace; font-size: 9px; letter-spacing: 1.8px;
    color: #FF8F8F; background: rgba(255,59,59,.12);
    border: 1px solid rgba(255,59,59,.25); padding: 7px 12px; border-radius: 999px;
  }
  .title { margin-top: 26px; }
  .title h1 { font-family: "Space Grotesk", sans-serif; font-size: 34px; font-weight: 700; letter-spacing: -.5px; }
  .title p { margin-top: 7px; font-size: 12.5px; color: #A6A6AA; }
  .score {
    display: flex; align-items: flex-end; gap: 34px;
    margin-top: 22px; padding: 24px 0 22px;
    border-top: 1px solid rgba(255,255,255,.08);
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .num { font-family: "Space Grotesk", sans-serif; font-size: 92px; font-weight: 700; line-height: .82; letter-spacing: -3px; }
  .num small { font-family: "Inter", sans-serif; font-size: 18px; font-weight: 500; color: #6B6B70; letter-spacing: 0; margin-left: 8px; }
  .meta { padding-bottom: 4px; }
  .band { display: inline-block; font-family: "IBM Plex Mono", monospace; font-size: 10px; letter-spacing: 1.8px; color: #FF8F8F; background: rgba(255,59,59,.13); padding: 6px 11px; border-radius: 999px; }
  .verdict { margin-top: 11px; max-width: 590px; font-size: 13.5px; line-height: 1.5; color: #D4D4D0; }
  .leaks { margin-top: 22px; }
  .leak { display: flex; align-items: center; gap: 16px; padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
  .leak:last-child { border-bottom: 0; }
  .leak-num { width: 24px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: #6B6B70; }
  .leak h3 { font-family: "Space Grotesk", sans-serif; font-size: 17px; font-weight: 600; }
  .leak .stage { margin-top: 4px; font-size: 11px; color: #8A8A90; }
  .leak .chip { margin-left: auto; }
  .breakdown { margin-top: 20px; }
  .bars { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px; }
  .bar { display: flex; align-items: center; gap: 12px; }
  .bar-name { width: 150px; font-size: 11px; color: #A6A6AA; }
  .track { flex: 1; height: 5px; border-radius: 3px; background: #1C1C1F; overflow: hidden; }
  .track i { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg, #FF3B3B, #FF8F8F); }
  .bar-val { width: 62px; text-align: right; font-family: "IBM Plex Mono", monospace; font-size: 9px; color: #6B6B70; }
  .strengths { margin-top: 20px; }
  .strength-grid { margin-top: 11px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 22px; }
  .strength { display: flex; gap: 8px; font-size: 10.5px; line-height: 1.45; color: #B4B4BA; }
  .strength b { color: #3FBF7F; font-weight: 700; }
  .footer { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.08); display: flex; justify-content: space-between; font-family: "IBM Plex Mono", monospace; font-size: 9px; letter-spacing: 1.2px; color: #6B6B70; }
</style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="top">
        <div class="brand">
          <img src="${LOGO_URL}" alt="">
          <span>WEBSITE SCORECARD</span>
        </div>
        <div class="badge">SYNTHETIC EXAMPLE</div>
      </div>

      <div class="title">
        <h1>${esc(content.client)}</h1>
        <p>${esc(content.url)} · ${esc(content.trade)} · ${esc(content.market)} · ${esc(content.date)}</p>
      </div>

      <div class="score">
        <div class="num">${esc(scores.display ?? Math.round(scores.total))}<small>/ 100</small></div>
        <div class="meta">
          <span class="band">${esc(scores.band)} — ${esc(scores.band_label.toUpperCase())}</span>
          <p class="verdict">${esc(content.verdict)}</p>
        </div>
      </div>

      <div class="leaks">
        <div class="label">THE THREE BIGGEST REVENUE LEAKS</div>
        ${leaks
          .map((leak, index) => {
            const [label, cls] = CONFIDENCE[leak.confidence] ?? CONFIDENCE.owner_data_required;
            return `<div class="leak">
              <div class="leak-num">${String(index + 1).padStart(2, "0")}</div>
              <div>
                <h3>${esc(leak.title)}</h3>
                <div class="stage">Stage: ${esc(leak.stage)}</div>
              </div>
              <span class="chip ${cls}">${label}</span>
            </div>`;
          })
          .join("")}
      </div>

      <div class="breakdown">
        <div class="label">SCORE BREAKDOWN</div>
        <div class="bars">
          ${scores.categories
            .map(
              (category) => `<div class="bar">
                <span class="bar-name">${esc(category.name)}</span>
                <div class="track"><i style="width:${Math.round((category.normalized / category.max) * 100)}%"></i></div>
                <span class="bar-val">${category.normalized.toFixed(1)}/${category.max}</span>
              </div>`,
            )
            .join("")}
        </div>
      </div>

      <div class="strengths">
        <div class="label">WHAT IS ALREADY WORKING</div>
        <div class="strength-grid">
          ${(content.strengths ?? [])
            .map((strength) => `<div class="strength"><b>✓</b><span>${esc(strength)}</span></div>`)
            .join("")}
        </div>
      </div>

      <div class="footer">
        <span>SYNTHETIC EXAMPLE · NOT A REAL BUSINESS</span>
        <span>WEBSITE SCORECARD · V2</span>
      </div>
    </div>
  </div>
</body>
</html>`;

const socialHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Website Scorecard — social preview</title>
${fontLinks}
<style>
  ${base}
  html, body { width: 1280px; height: 640px; }
  .page { width: 1280px; height: 640px; padding: 58px 68px; position: relative; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand img { width: 30px; height: 30px; }
  .brand span { font-family: "IBM Plex Mono", monospace; font-size: 10px; letter-spacing: 2.4px; color: #A6A6AA; }
  .eyebrow { margin-top: 54px; font-family: "IBM Plex Mono", monospace; font-size: 11px; letter-spacing: 2.4px; color: #FF3B3B; }
  h1 { margin-top: 16px; width: 760px; font-family: "Space Grotesk", sans-serif; font-size: 55px; line-height: 1.06; letter-spacing: -1.6px; font-weight: 700; }
  .sub { margin-top: 20px; width: 720px; font-size: 17px; line-height: 1.5; color: #A6A6AA; }
  .trades { margin-top: 28px; display: flex; gap: 7px; flex-wrap: wrap; width: 800px; }
  .trades span { font-family: "IBM Plex Mono", monospace; font-size: 8.5px; letter-spacing: 1.2px; color: #8A8A90; border: 1px solid rgba(255,255,255,.13); border-radius: 999px; padding: 5px 9px; }
  .bottom { position: absolute; left: 68px; bottom: 48px; display: flex; align-items: center; gap: 18px; font-family: "IBM Plex Mono", monospace; font-size: 11px; letter-spacing: 1.4px; color: #6B6B70; }
  .bottom b { color: #A6A6AA; font-weight: 500; }
  .panel { position: absolute; right: 64px; top: 128px; width: 344px; padding: 26px 28px; }
  .panel .label { margin-bottom: 14px; }
  .panel .big { font-family: "Space Grotesk", sans-serif; font-size: 74px; font-weight: 700; line-height: .85; letter-spacing: -2px; }
  .panel .big small { font-family: "Inter", sans-serif; font-size: 15px; color: #6B6B70; letter-spacing: 0; font-weight: 500; }
  .panel .band { display: inline-block; margin-top: 14px; font-family: "IBM Plex Mono", monospace; font-size: 9.5px; letter-spacing: 1.8px; color: #FF8F8F; background: rgba(255,59,59,.13); padding: 6px 10px; border-radius: 999px; }
  .rows { margin-top: 18px; border-top: 1px solid rgba(255,255,255,.08); padding-top: 14px; display: grid; gap: 10px; }
  .row { display: flex; align-items: center; gap: 9px; font-size: 11px; color: #B4B4BA; }
  .dot { width: 7px; height: 7px; border-radius: 50%; }
  .journey { margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.08); }
  .journey .label { font-size: 8.5px; }
  .dots { margin-top: 9px; display: flex; gap: 4px; }
  .dots i { width: 16px; height: 4px; border-radius: 2px; display: block; }
</style>
</head>
<body>
  <div class="page">
    <div class="brand">
      <img src="${LOGO_URL}" alt="">
      <span>WEBSITE SCORECARD</span>
    </div>

    <div class="eyebrow">FOR LOCAL HOME-SERVICE BUSINESSES</div>
    <h1>Find where local home-service websites leak customers.</h1>
    <p class="sub">An evidence-based scorecard for plumbing, HVAC, roofing, electrical, and similar trades. Score what the site can prove. Ask the owner the rest.</p>

    <div class="trades">
      <span>PLUMBING</span><span>HVAC</span><span>ROOFING</span><span>ELECTRICAL</span>
      <span>PEST CONTROL</span><span>GARAGE DOOR</span><span>LANDSCAPING</span><span>RESTORATION</span><span>CLEANING</span>
    </div>

    <div class="bottom">
      <span><b>github.com/thatguynef/website-scorecard</b></span>
      <span>OPEN SOURCE · MIT</span>
    </div>

    <div class="panel card">
      <div class="label">SAMPLE SCORE</div>
      <div class="big">${esc(scores.display ?? Math.round(scores.total))}<small> / 100</small></div>
      <div class="band">${esc(scores.band)} — ${esc(scores.band_label.toUpperCase())}</div>
      <div class="rows">
        <div class="row"><span class="dot" style="background:#3FBF7F"></span>${counts.verified} verified leak${counts.verified === 1 ? "" : "s"}</div>
        <div class="row"><span class="dot" style="background:#F5C766"></span>${counts.strong} strong signal${counts.strong === 1 ? "" : "s"}</div>
        <div class="row"><span class="dot" style="background:#6B6B70"></span>${counts.owner} owner-data question${counts.owner === 1 ? "" : "s"}</div>
      </div>
      <div class="journey">
        <div class="label">12-STAGE JOURNEY</div>
        <div class="dots">
          <i style="background:#FF3B3B"></i><i style="background:#FF3B3B"></i><i style="background:#FF3B3B"></i>
          <i style="background:#F5C766"></i><i style="background:#F5C766"></i><i style="background:#F5C766"></i><i style="background:#F5C766"></i>
          <i style="background:#3A3A40"></i><i style="background:#3A3A40"></i>
          <i style="background:#F5C766"></i>
          <i style="background:#3A3A40"></i><i style="background:#3A3A40"></i>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const chrome = chromePath();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ws-docs-assets-"));
const profile = path.join(tmp, "profile");

function render(name, html, width, height, output, scale = 1) {
  const htmlPath = path.join(tmp, `${name}.html`);
  fs.writeFileSync(htmlPath, html);
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    `--force-device-scale-factor=${scale}`,
    "--virtual-time-budget=8000",
    "--run-all-compositor-stages-before-draw",
    `--screenshot=${output}`,
    `file://${htmlPath}`,
  ];
  execFileSync(chrome, args, { stdio: "ignore" });
  if (!fs.existsSync(output)) fail(`Chrome did not produce ${output}`);
  const bytes = fs.statSync(output).size;
  console.log(`wrote ${path.relative(ROOT, output)} (${(bytes / 1024).toFixed(0)} KB)`);
}

fs.mkdirSync(OUT, { recursive: true });
render("scorecard-preview", previewHtml, 1200, 1000, path.join(OUT, "scorecard-preview.png"));
render("scorecard-preview-640", previewHtml, 1200, 1000, path.join(OUT, "scorecard-preview-640.png"), 0.5333);
render("social-preview", socialHtml, 1280, 640, path.join(OUT, "social-preview.png"));

fs.rmSync(tmp, { recursive: true, force: true });
console.log("done");
