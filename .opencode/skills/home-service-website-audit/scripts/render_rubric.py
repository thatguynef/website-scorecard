#!/usr/bin/env python3
"""Render a human-readable rubric from the canonical rubric JSON.

Usage:
  python3 render_rubric.py
  python3 render_rubric.py --rubric references/legacy/rubric-v1.1.3.json \
      --out references/legacy/rubric-v1.1.3.md
  python3 render_rubric.py --check
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEFAULT_RUBRIC = ROOT / "references" / "rubric.json"
DEFAULT_OUT = ROOT / "references" / "rubric.md"


def is_v2(rubric: dict) -> bool:
    return rubric.get("schema_version") == "2.0" or rubric.get("framework") == "revenue-leak"


def render_v1(rubric: dict) -> str:
    lines = [
        "# Home Service Website Audit - Legacy Rubric (V1)",
        "",
        f"Version {rubric['version']} · {rubric['total']} points · {len(rubric['items'])} checks",
        "",
        "> **Historical.** This is the legacy 42-check Hormozi rubric. New audits use the",
        "> Revenue Leak Framework in `references/rubric.json`. Historical reports keep V1 scores;",
        "> they are never silently rescored under V2.",
        "",
        "Mobile is the primary viewport. Shared checks are scored on the weaker viewport. "
        "A7 (Spanish access) is split 3 points mobile / 1 point desktop.",
        "",
        "## Categories",
        "",
        "| ID | Category | Points |",
        "|---|---|---|",
    ]
    for cat in rubric["categories"]:
        lines.append(f"| {cat['id']} | {cat['name']} | {cat['max']} |")
    lines += ["", "## Caps", "", "| Cap | Maximum | Condition |", "|---|---|---|"]
    for cap in rubric["caps"]:
        lines.append(f"| {cap['id']} | {cap['max']} | {cap['label']} |")
    lines += ["", "## Bands", "", "| Score | Band | Label |", "|---|---|---|"]
    for band in rubric["bands"]:
        lines.append(f"| {band['min']}+ | {band['band']} | {band['label']} |")

    current = None
    for item in rubric["items"]:
        if item["cat"] != current:
            current = item["cat"]
            cat = next(c for c in rubric["categories"] if c["id"] == current)
            lines += ["", f"## {cat['id']}. {cat['name']} - {cat['max']} points", ""]
        lines.append(f"### {item['id']}. {item['title']} - {item['max']} {'point' if item['max'] == 1 else 'points'}")
        lines.append(
            f"*Viewports: {', '.join(item['viewports'])} · Evidence: {item['evidence']} · Principle: {item['principle']}*"
        )
        lines.append("")
        if item.get("split"):
            for viewport, anchors in item["anchors"].items():
                lines.append(f"**{viewport.title()} ({item['split'][viewport]} points)**")
                for score in sorted(anchors, key=int, reverse=True):
                    lines.append(f"- **{score}** - {anchors[score]}")
                lines.append("")
        else:
            for score in sorted(item["anchors"], key=int, reverse=True):
                lines.append(f"- **{score}** - {item['anchors'][score]}")
            lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def render_v2(rubric: dict) -> str:
    lines = [
        "# Website Revenue Leak Scorecard - Rubric",
        "",
        f"Version {rubric['version']} · {rubric['total']} points · {len(rubric['items'])} scored checks · {len(rubric.get('ownerData', []))} owner-data prompts",
        "",
        "> This file is generated from `references/rubric.json`. Do not edit it by hand.",
        "",
        "The score answers one question: **where could this contractor be losing customers or revenue?**",
        "It follows the customer journey, separates observable website problems from internal business",
        "opportunities, and never penalizes a site for data the audit cannot see.",
        "",
        "Mobile is the primary viewport. When a check lists mobile and desktop, the weaker viewport wins.",
        "",
        "## Categories",
        "",
        "| ID | Category | Weight | Question |",
        "|---|---|---|---|",
    ]
    for cat in rubric["categories"]:
        lines.append(f"| {cat['id']} | {cat['name']} | {cat['max']} | {cat.get('question', '')} |")

    lines += ["", "## Scoring math", ""]
    scoring = rubric.get("scoring", {})
    for key in ["required", "recommended", "conditional", "rounding", "owner_data", "weaker_viewport"]:
        if scoring.get(key):
            lines.append(f"- **{key.replace('_', ' ').title()}:** {scoring[key]}")
    lines += ["", f"**Normalization:** {scoring.get('formula', '')}", ""]

    lines += ["## Caps", "", "| Cap | Maximum | Condition |", "|---|---|---|"]
    for cap in rubric["caps"]:
        lines.append(f"| `{cap['id']}` | {cap['max']} | {cap['label']} |")

    lines += ["", "## Bands", "", "| Score | Band | Label |", "|---|---|---|"]
    for band in rubric["bands"]:
        lines.append(f"| {band['min']}+ | {band['band']} | {band['label']} |")

    lines += ["", "## Customer journey coverage", "", "| # | Stage | Coverage | Scored checks | Owner-data prompts |", "|---|---|---|---|---|"]
    for stage in rubric.get("journey", []):
        checks = ", ".join(stage.get("checks", [])) or "-"
        owner = ", ".join(stage.get("ownerData", [])) or "-"
        lines.append(f"| {stage['order']} | {stage['label']} | {stage['coverageStatus']} | {checks} | {owner} |")

    lines += ["", "## Supporting systems", ""]
    for system in rubric.get("supportingSystems", []):
        lines.append(f"- **{system['label']}:** {', '.join(system.get('checks', [])) or 'opportunity-only'}")

    current = None
    for item in rubric["items"]:
        if item["cat"] != current:
            current = item["cat"]
            cat = next(c for c in rubric["categories"] if c["id"] == current)
            lines += ["", f"## {cat['id']}. {cat['name']} - {cat['max']} points", ""]
        lines.append(f"### {item['id']} - {item['title']} - {item['max']} {'point' if item['max'] == 1 else 'points'}")
        legacy = f" · Legacy: {', '.join(item['legacyIds'])}" if item.get("legacyIds") else ""
        lines.append(
            f"*Stage: {item.get('journeyStage')} · Evaluation: {item.get('evaluation')} · "
            f"Applicability: {item.get('applicability')} · Severity: {item.get('severity')}{legacy}*"
        )
        lines.append(
            f"*Viewports: {', '.join(item.get('viewports', []))} · Evidence: {item.get('evidence', '')} · "
            f"Service: {item.get('serviceMapping', 'none')}*"
        )
        if item.get("recommendedIntervention"):
            lines.append(f"*Recommended intervention: {item['recommendedIntervention']}*")
        lines.append("")
        for score in sorted(item["anchors"], key=int, reverse=True):
            lines.append(f"- **{score}** - {item['anchors'][score]}")
        lines.append("")

    if rubric.get("optionalModules"):
        lines += ["## Optional modules", "", "| Module | Scored | Default | Checks | Notes |", "|---|---|---|---|---|"]
        for module in rubric["optionalModules"]:
            checks = ", ".join(module.get("checks", [])) or "-"
            lines.append(
                f"| `{module['id']}` | {'yes' if module.get('scored') else 'no'} | "
                f"{'on' if module.get('defaultApplicable') else 'off'} | {checks} | {module.get('description', '')} |"
            )

    lines += ["", "## Owner-data prompts (never scored)", ""]
    for entry in rubric.get("ownerData", []):
        lines.append(f"### {entry['id']} - {entry['title']}")
        lines.append(f"*Stage: {entry.get('journeyStage')} · Service: {entry.get('serviceMapping', 'none')} · Confidence: owner data required*")
        lines.append("")
        lines.append(entry.get("whyItMatters", ""))
        lines.append("")
        for question in entry.get("questions", []):
            lines.append(f"- {question}")
        lines.append("")

    lines += ["## Service mappings", "", "| ID | Label | Description |", "|---|---|---|"]
    for mapping in rubric.get("serviceMappings", []):
        lines.append(f"| `{mapping['id']}` | {mapping['label']} | {mapping['description']} |")

    return "\n".join(lines).rstrip() + "\n"


def render(rubric: dict) -> str:
    return render_v2(rubric) if is_v2(rubric) else render_v1(rubric)


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a rubric Markdown file from rubric JSON.")
    parser.add_argument("--rubric", default=str(DEFAULT_RUBRIC))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--check", action="store_true", help="Fail if the generated file is stale")
    args = parser.parse_args()

    rubric_path = Path(args.rubric)
    out_path = Path(args.out)
    try:
        rubric = json.loads(rubric_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"error: rubric not found: {rubric_path}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as exc:
        print(f"error: invalid rubric JSON: {exc}", file=sys.stderr)
        return 2

    rendered = render(rubric)
    if args.check:
        if not out_path.exists():
            print(f"error: generated file missing: {out_path}", file=sys.stderr)
            return 1
        if out_path.read_text(encoding="utf-8") != rendered:
            print(f"error: generated file is stale: {out_path}", file=sys.stderr)
            print("run: python3 render_rubric.py --rubric ... --out ...", file=sys.stderr)
            return 1
        print(f"ok: {out_path}")
        return 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    print(f"wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
