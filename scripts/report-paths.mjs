#!/usr/bin/env node
/**
 * Path helpers for grouping client reports by prospect domain.
 *
 * Reports are local and gitignored. A run is stored as:
 *   reports/<domain>/<run-id>/
 *
 * The domain is the canonical hostname without a leading www. Subdomains are
 * preserved so parts.example.com and example.com do not collide.
 */

import path from "node:path";

const RUN_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Return a filesystem-safe prospect domain for a public URL.
 * @param {string} url
 * @returns {string}
 */
export function domainFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`invalid URL: ${url}`);
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("URL must start with http:// or https://");
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const safe = host
    .replace(/^\[|\]$/g, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.-]+|[.-]+$/g, "");

  if (!safe || safe === "." || safe === "..") {
    throw new Error(`cannot derive a safe domain directory from ${host || "the URL"}`);
  }
  return safe;
}

/**
 * Default report directory for one audit run.
 * @param {string} url
 * @param {string} runId
 * @param {string} [root]
 * @returns {string}
 */
export function reportDirFor(url, runId, root = "reports") {
  if (!RUN_ID_RE.test(String(runId || ""))) {
    throw new Error(`invalid run id: ${runId}`);
  }
  return path.join(root, domainFromUrl(url), String(runId));
}

/**
 * Make a report path relative to the reports root using forward slashes, so it
 * can be used in reports/index.local.md.
 * @param {string} reportDir
 * @param {string} [root]
 * @returns {string}
 */
export function reportRelativeDir(reportDir, root = "reports") {
  const relative = path.relative(path.resolve(root), path.resolve(reportDir));
  return relative.split(path.sep).join("/");
}

/**
 * Links for the report index, relative to reports/index.local.md.
 * @param {string} reportDir
 * @param {string} [root]
 * @returns {{dir: string, onePage: string, fullReport: string}}
 */
export function reportLinks(reportDir, root = "reports") {
  const relative = reportRelativeDir(reportDir, root);
  const prefix = relative && relative !== "." ? `${relative}/` : "";
  return {
    dir: relative || ".",
    onePage: `${prefix}one-page.md`,
    fullReport: `${prefix}full-report.md`,
  };
}
