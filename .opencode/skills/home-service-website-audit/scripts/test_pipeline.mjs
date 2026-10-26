#!/usr/bin/env node
/** End-to-end pipeline tests for the V2 scorecard. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const SCRIPTS = path.join(ROOT, ".opencode", "skills", "home-service-website-audit", "scripts");
const FIXTURES = path.join(SCRIPTS, "fixtures");
const EXAMPLE = path.join(ROOT, "examples", "acme-plumbing");
const LEGACY_RUBRIC = path.join(
  ROOT,
  ".opencode",
  "skills",
  "home-service-website-audit",
  "references",
  "legacy",
  "rubric-v1.1.3.json"
);

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120000,
    ...options,
  });
}

function runNode(script, args) {
  return run(process.execPath, [script, ...args]);
}

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("public CLIs expose help", () => {
  const commands = [
    [path.join(SCRIPTS, "collect.mjs")],
    [path.join(SCRIPTS, "render.mjs")],
    [path.join(SCRIPTS, "verify.mjs")],
    [path.join(SCRIPTS, "eval.mjs")],
    [path.join(SCRIPTS, "index.mjs")],
    [path.join(ROOT, "scripts", "audit.mjs")],
    [path.join(ROOT, "scripts", "doctor.mjs")],
  ];
  for (const [script] of commands) {
    const result = runNode(script, ["--help"]);
    assert.equal(result.status, 0, `${script} --help failed: ${result.stderr}`);
    assert.match(result.stdout, /Usage:/i);
  }
});

test("collector rejects an invalid URL", () => {
  const result = runNode(path.join(SCRIPTS, "collect.mjs"), ["--url", "not-a-url"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /invalid --url/i);
});

test("V2 golden fixture scores 68 / C and V1 fixture scores 36 / F", () => {
  const out = tempDir("scorecard-score-");
  const v2 = run("python3", [
    path.join(SCRIPTS, "score.py"),
    "--input", path.join(FIXTURES, "acme-plumbing-v2.audit.json"),
    "--out", path.join(out, "v2.json"),
    "--strict",
  ]);
  assert.equal(v2.status, 0, v2.stderr);
  const v2s = JSON.parse(fs.readFileSync(path.join(out, "v2.json"), "utf8"));
  assert.equal(v2s.display, 68);
  assert.equal(v2s.band, "C");

  const v1 = run("python3", [
    path.join(SCRIPTS, "score.py"),
    "--input", path.join(FIXTURES, "legacy-roofing-a-v1.audit.json"),
    "--rubric", LEGACY_RUBRIC,
    "--out", path.join(out, "v1.json"),
    "--strict",
  ]);
  assert.equal(v1.status, 0, v1.stderr);
  const v1s = JSON.parse(fs.readFileSync(path.join(out, "v1.json"), "utf8"));
  assert.equal(v1s.display, 36);
  assert.equal(v1s.band, "F");
});

test("renderer produces a V2 one-pager and full report", () => {
  const out = tempDir("scorecard-render-");
  const one = runNode(path.join(SCRIPTS, "render.mjs"), [
    "--scores", path.join(EXAMPLE, "scores.json"),
    "--content", path.join(EXAMPLE, "content.json"),
    "--out", path.join(out, "one-page.md"),
  ]);
  assert.equal(one.status, 0, one.stderr);
  const oneText = fs.readFileSync(path.join(out, "one-page.md"), "utf8");
  assert.match(oneText, /68 \/ 100/);
  assert.match(oneText, /Customer Journey/);
  assert.match(oneText, /Revenue Opportunities to Investigate/);
  assert.match(oneText, /VERIFIED/);
  assert.match(oneText, /STRONG SIGNAL/);
  assert.match(oneText, /OWNER DATA REQUIRED/);
  assert.match(oneText, /\| \*\*Total\*\* \| \*\*68 \/ 100\*\* \|/);

  const full = runNode(path.join(SCRIPTS, "render.mjs"), [
    "--mode", "full",
    "--scores", path.join(EXAMPLE, "scores.json"),
    "--content", path.join(EXAMPLE, "content.json"),
    "--out", path.join(out, "full.md"),
  ]);
  assert.equal(full.status, 0, full.stderr);
  const fullText = fs.readFileSync(path.join(out, "full.md"), "utf8");
  assert.match(fullText, /\*\*Score:\*\* 68 \/ 100/);
  assert.equal((fullText.match(/^\| RL-[A-Z]{3}-\d{2} \|/gm) || []).length, 40);
});

test("synthetic example passes the verifier with mutations and fixtures", () => {
  const result = runNode(path.join(SCRIPTS, "verify.mjs"), [
    "--run", EXAMPLE,
    "--report", path.join(EXAMPLE, "full-report.md"),
    "--one-page", path.join(EXAMPLE, "one-page.md"),
    "--index", path.join(ROOT, "examples", "README.md"),
    "--mutation",
    "--fixture",
    "--synthetic",
  ]);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.result, "pass");
  assert.equal(parsed.score, 68);
  assert.equal(parsed.mutation_tests, true);
  assert.equal(parsed.fixture.v1.pass, true);
  assert.equal(parsed.fixture.v2.pass, true);
});

test("verifier rejects a tampered one-pager score", () => {
  const copy = tempDir("scorecard-tamper-");
  fs.cpSync(EXAMPLE, copy, { recursive: true });
  const onePage = path.join(copy, "one-page.md");
  fs.writeFileSync(onePage, fs.readFileSync(onePage, "utf8").replaceAll("68 / 100", "99 / 100"));
  const result = runNode(path.join(SCRIPTS, "verify.mjs"), [
    "--run", copy,
    "--report", path.join(copy, "full-report.md"),
    "--one-page", onePage,
    "--synthetic",
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /I15|I18/);
});

test("reports index is idempotent", () => {
  const dir = tempDir("scorecard-index-");
  const index = path.join(dir, "README.md");
  fs.writeFileSync(index, "| Date | Client | Market | Score | Band | Reports |\n|---|---|---|---|---|---|\n");
  const args = [
    "--reports", index,
    "--client", "Example Co.",
    "--market", "Example City",
    "--score", "68",
    "--band", "C — Average",
    "--date", "2026-10-26",
    "--one-page", "one.md",
    "--full", "full.md",
  ];
  const first = runNode(path.join(SCRIPTS, "index.mjs"), args);
  const second = runNode(path.join(SCRIPTS, "index.mjs"), args);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  const text = fs.readFileSync(index, "utf8");
  assert.equal((text.match(/Example Co\./g) || []).length, 1);
  assert.match(text, /\*\*68\/100\*\*/);
});

test("generated rubric, coverage, and portable checklist are current", () => {
  const commands = [
    ["render_rubric.py", "--check"],
    ["render_coverage.py", "--check"],
    ["render_portable.py", "--check"],
  ];
  for (const [script, flag] of commands) {
    const result = run("python3", [path.join(SCRIPTS, script), flag]);
    assert.equal(result.status, 0, `${script} ${flag}: ${result.stderr}`);
  }
});

test("rubric validates and documents 40 checks and 12 owner-data prompts", () => {
  const result = run("python3", [path.join(SCRIPTS, "validate_rubric.py")]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /40 checks/);
  assert.match(result.stdout, /12 owner-data prompts/);
});
