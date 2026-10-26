#!/usr/bin/env node
/** Check relative Markdown links for broken targets. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const HELP = `Website Scorecard — link checker

Usage:
  node scripts/check_links.mjs

Checks tracked Markdown files plus untracked, non-ignored files.

Exit 1 if a relative link target is missing.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(HELP);
  process.exit(0);
}

let files;
try {
  files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  })
    .split("\n")
    .filter((file) => file.endsWith(".md"));
} catch (error) {
  console.error(`error: could not list files: ${error.message}`);
  process.exit(2);
}

const broken = [];
for (const file of files) {
  const absolute = path.join(ROOT, file);
  if (!fs.existsSync(absolute)) continue;
  let text = fs.readFileSync(absolute, "utf8");
  // Remove fenced code blocks so example links do not count.
  text = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (!target || target.startsWith("#") || /^(https?:|mailto:|tel:|sms:)/i.test(target)) continue;
    target = target.split("#")[0];
    if (!target || target.includes("{{")) continue;
    try {
      target = decodeURI(target);
    } catch {}
    const resolved = path.resolve(path.dirname(absolute), target);
    if (!fs.existsSync(resolved)) {
      broken.push(`${file} -> ${match[1]}`);
    }
  }
}

console.log(`Checked ${files.length} Markdown files.`);
if (broken.length) {
  for (const item of broken) console.error(`FAIL  ${item}`);
  console.error(`\n${broken.length} broken relative link(s).`);
  process.exit(1);
}
console.log("ok: no broken relative links.");
