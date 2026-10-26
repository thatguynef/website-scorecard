#!/usr/bin/env node
/** Check the local toolchain for a Website Revenue Leak Scorecard run. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const HELP = `Website Revenue Leak Scorecard — doctor

Usage:
  node scripts/doctor.mjs

Checks Node, Python, Chrome/Chromium, Lighthouse, and git. Lighthouse is optional.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

const rows = [];
const add = (name, ok, detail, required = true) => rows.push({ name, ok, detail, required });

function commandVersion(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split(".")[0]);
const nodeOk = nodeMajor >= 22;
add("Node.js", nodeOk, `v${nodeVersion}${nodeOk ? "" : " (need 22+)"}`);

const python = commandVersion("python3", ["--version"]);
const pythonVersion = python?.replace(/^Python\s+/i, "") || "";
const pythonMajor = Number(pythonVersion.split(".")[0]);
const pythonMinor = Number(pythonVersion.split(".")[1]);
add("Python", Boolean(python) && (pythonMajor > 3 || (pythonMajor === 3 && pythonMinor >= 10)), python || "python3 not found");

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
add("Chrome/Chromium", Boolean(chrome), chrome || "not found; set CHROME_PATH");

const lighthouse = commandVersion("npx", ["--no-install", "lighthouse", "--version"]);
add("Lighthouse", Boolean(lighthouse), lighthouse || "not installed (optional; use --skip-lighthouse)", false);

const git = commandVersion("git", ["--version"]);
add("git", Boolean(git), git || "not found");

for (const row of rows) {
  const label = row.ok ? "ok  " : row.required ? "FAIL" : "warn";
  console.log(`${label}  ${row.name.padEnd(16)} ${row.detail}`);
}

const failures = rows.filter((row) => row.required && !row.ok);
console.log("");
if (failures.length) {
  console.log(`Fix ${failures.length} required tool(s) before running a real audit.`);
  process.exit(1);
}
console.log("Ready. Run: npm run audit -- --help");
