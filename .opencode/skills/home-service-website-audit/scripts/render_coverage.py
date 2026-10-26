#!/usr/bin/env python3
"""Generate the canonical Revenue Leak coverage matrix from rubric.json.

The rubric is the single source of truth. This script derives the machine-readable
matrix used by downstream tools and fails CI when the generated file is stale.

Usage:
  python3 render_coverage.py
  python3 render_coverage.py --check
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEFAULT_RUBRIC = ROOT / "references" / "rubric.json"
DEFAULT_OUT = ROOT / "references" / "coverage-matrix.json"


def build(rubric: dict) -> dict:
    owner = {entry["id"]: entry for entry in rubric.get("ownerData", [])}
    checks = []
    for item in rubric["items"]:
        checks.append(
            {
                "id": item["id"],
                "name": item["title"],
                "legacyIds": item.get("legacyIds", []),
                "journeyStage": item.get("journeyStage"),
                "revenueLeakCategory": item.get("revenueLeak"),
                "category": item["cat"],
                "evidenceType": item.get("evidenceType", []),
                "evaluation": item.get("evaluation"),
                "applicability": item.get("applicability"),
                "module": item.get("module"),
                "severity": item.get("severity"),
                "scoringBehavior": "scored"
                if item.get("applicability") == "required"
                else "scored_by_default"
                if item.get("applicability") == "recommended"
                else "conditional",
                "confidence": "verified" if item.get("evaluation") == "deterministic" else "verified_or_strong_signal",
                "recommendedIntervention": item.get("recommendedIntervention"),
                "serviceMapping": item.get("serviceMapping"),
                "max": item["max"],
            }
        )

    stages = []
    for stage in rubric.get("journey", []):
        stage_checks = [c for c in checks if c["id"] in stage.get("checks", [])]
        stage_owner = [owner[oid] for oid in stage.get("ownerData", []) if oid in owner]
        stages.append(
            {
                "id": stage["id"],
                "order": stage["order"],
                "label": stage["label"],
                "customerQuestion": stage.get("customerQuestion"),
                "coverageStatus": stage.get("coverageStatus"),
                "scoredChecks": [c["id"] for c in stage_checks],
                "ownerData": [
                    {"id": entry["id"], "title": entry["title"], "questions": entry.get("questions", [])}
                    for entry in stage_owner
                ],
            }
        )

    counts = Counter(c["applicability"] for c in checks)
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Website Revenue Leak coverage matrix",
        "rubricVersion": rubric["version"],
        "generatedFrom": "references/rubric.json",
        "framework": rubric.get("framework"),
        "summary": {
            "scoredChecks": len(checks),
            "required": counts.get("required", 0),
            "recommended": counts.get("recommended", 0),
            "conditional": counts.get("conditional", 0),
            "ownerDataPrompts": len(owner),
            "journeyStages": len(stages),
        },
        "journey": stages,
        "supportingSystems": rubric.get("supportingSystems", []),
        "checks": checks,
        "optionalModules": rubric.get("optionalModules", []),
        "serviceMappings": rubric.get("serviceMappings", []),
        "ownerData": [
            {
                "id": entry["id"],
                "title": entry["title"],
                "journeyStage": entry.get("journeyStage"),
                "confidence": entry.get("confidence", "owner_data_required"),
                "serviceMapping": entry.get("serviceMapping"),
                "questions": entry.get("questions", []),
            }
            for entry in rubric.get("ownerData", [])
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the coverage matrix from rubric.json.")
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

    rendered = json.dumps(build(rubric), indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not out_path.exists():
            print(f"error: generated file missing: {out_path}", file=sys.stderr)
            return 1
        if out_path.read_text(encoding="utf-8") != rendered:
            print(f"error: generated file is stale: {out_path}", file=sys.stderr)
            print("run: python3 render_coverage.py", file=sys.stderr)
            return 1
        print(f"ok: {out_path}")
        return 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    print(f"wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
