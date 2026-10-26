#!/usr/bin/env python3
"""Generate the portable checklist for external browser agents.

This is a derived artifact. `references/rubric.json` remains the single source of
truth. The checklist is intentionally plain Markdown so an agent that cannot read
the skill directory can still run the framework.

Usage:
  python3 render_portable.py
  python3 render_portable.py --check
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEFAULT_RUBRIC = ROOT / "references" / "rubric.json"
DEFAULT_OUT = ROOT.parent.parent.parent / "docs" / "portable-checklist.md"


def render(rubric: dict) -> str:
    lines = [
        "# Website Revenue Leak Scorecard - Portable Checklist",
        "",
        f"**Rubric version:** {rubric['version']} · **Generated from:** `references/rubric.json`",
        "",
        "Use this file when you are an external browser agent and cannot read the repository",
        "skill directory. It is a derived copy, not a second rubric.",
        "",
        "## Mission",
        "",
        "> You are diagnosing where a local home-service website may be leaking customers and revenue.",
        "> Follow the customer journey. Separate what you can observe from what only the owner can answer.",
        "> Never submit a form, place a call, send a text, book an appointment, create an account, or enter payment details.",
        "",
        "## Inputs",
        "",
        "| Input | Required | Example |",
        "|---|---|---|",
        "| Website URL | Yes | `https://example.com` |",
        "| Business name | Yes | `Example Plumbing` |",
        "| Trade | Yes | `plumbing` |",
        "| City / market | Yes | `San Diego, CA` |",
        "| Primary service term | Yes | `plumbing` |",
        "| Preferred languages | No | `[\"en\", \"es\"]` |",
        "| Optional modules | No | SMS, chat, financing, membership |",
        "",
        "## Evidence rules",
        "",
        "1. Screenshot or source citation, or it did not happen.",
        "2. Weaker viewport wins when a check lists mobile and desktop.",
        "3. Absent is a finding, not an assumption.",
        "4. Do not claim a business outcome that requires internal data.",
        "5. Use one of four evidence states: VERIFIED, STRONG SIGNAL, OWNER DATA REQUIRED, NOT APPLICABLE.",
        "6. Never submit a form or contact a business.",
        "",
        "## Scoring",
        "",
        f"- Total: {rubric['total']} points.",
        "- Required checks are always scored.",
        "- Recommended checks are scored unless the audit configuration excludes them.",
        "- Conditional checks are scored only when their module is enabled.",
        "- N/A checks are removed from the category denominator; category weights are normalized.",
        "- Owner-data prompts never affect the website score.",
        "",
        "## Journey",
        "",
        "| # | Stage | Coverage | Scored checks | Owner data |",
        "|---|---|---|---|---|",
    ]
    for stage in rubric.get("journey", []):
        lines.append(
            f"| {stage['order']} | {stage['label']} | {stage['coverageStatus']} | "
            f"{', '.join(stage.get('checks', [])) or '-'} | {', '.join(stage.get('ownerData', [])) or '-'} |"
        )

    lines += ["", "## Caps", "", "| Cap | Maximum | Condition |", "|---|---|---|"]
    for cap in rubric["caps"]:
        lines.append(f"| `{cap['id']}` | {cap['max']} | {cap['label']} |")

    lines += ["", "## Checks", ""]
    current = None
    for item in rubric["items"]:
        if item["cat"] != current:
            current = item["cat"]
            cat = next(c for c in rubric["categories"] if c["id"] == current)
            lines += [f"### {cat['id']}. {cat['name']} - {cat['max']} points", ""]
        lines.append(f"#### {item['id']} - {item['title']} - {item['max']} {'point' if item['max'] == 1 else 'points'}")
        lines.append(
            f"*Stage: {item.get('journeyStage')} · {item.get('applicability')} · "
            f"{item.get('evaluation')} · Evidence: {item.get('evidence', '')}*"
        )
        if item.get("recommendedIntervention"):
            lines.append(f"*Recommended intervention: {item['recommendedIntervention']}*")
        lines.append("")
        for score in sorted(item["anchors"], key=int, reverse=True):
            lines.append(f"- **{score}** - {item['anchors'][score]}")
        lines.append("")

    lines += ["## Owner-data prompts (do not score)", ""]
    for entry in rubric.get("ownerData", []):
        lines.append(f"### {entry['id']} - {entry['title']}")
        lines.append(entry.get("whyItMatters", ""))
        lines.append("")
        for question in entry.get("questions", []):
            lines.append(f"- {question}")
        lines.append("")

    lines += [
        "## Output",
        "",
        "Return: score / 100, category table, three biggest revenue leaks with confidence labels,",
        "journey summary, verified findings, strong signals, owner-data questions, and next steps.",
        "Do not present an owner-data prompt as a website failure.",
        "",
    ]
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the portable checklist from rubric.json.")
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
            print("run: python3 render_portable.py", file=sys.stderr)
            return 1
        print(f"ok: {out_path}")
        return 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    print(f"wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
