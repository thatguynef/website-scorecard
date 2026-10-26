#!/usr/bin/env python3
"""Validate the canonical rubric without external dependencies.

Checks structure, category weights, item anchors, journey references, optional
modules, caps, bands, and owner-data references. Returns 0 when valid.

Usage:
  python3 validate_rubric.py
  python3 validate_rubric.py --rubric references/legacy/rubric-v1.1.3.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_RUBRIC = HERE.parent / "references" / "rubric.json"
EVIDENCE_STATES = {"verified", "strong_signal", "owner_data_required", "not_applicable"}


def validate_v2(rubric: dict) -> list[str]:
    errors: list[str] = []
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(rubric.get("version", ""))):
        errors.append("version must be semver")
    if rubric.get("total") != 100:
        errors.append("total must be 100")

    cats = rubric.get("categories", [])
    if sum(c.get("max", 0) for c in cats) != 100:
        errors.append("category maxima must sum to 100")
    cat_ids = [c.get("id") for c in cats]
    if len(set(cat_ids)) != len(cat_ids):
        errors.append("category ids must be unique")

    bands = rubric.get("bands", [])
    if not bands or min(b.get("min", -1) for b in bands) != 0:
        errors.append("bands must start at 0")
    if not any(b.get("min") == 90 for b in bands):
        errors.append("bands must include min=90")

    item_ids = [i.get("id") for i in rubric.get("items", [])]
    if len(set(item_ids)) != len(item_ids):
        errors.append("item ids must be unique")
    by_cat = defaultdict(int)
    for item in rubric.get("items", []):
        cid = item.get("id", "?")
        if not re.fullmatch(r"RL-[A-Z]{3}-\d{2}", cid):
            errors.append(f"{cid}: id must look like RL-XXX-00")
        if item.get("cat") not in cat_ids:
            errors.append(f"{cid}: unknown category")
        by_cat[item.get("cat")] += item.get("max", 0)
        if item.get("max", 0) <= 0:
            errors.append(f"{cid}: max must be positive")
        allowed = item.get("allowed", [])
        if item.get("max") not in allowed:
            errors.append(f"{cid}: allowed must include max")
        if not item.get("anchors"):
            errors.append(f"{cid}: anchors are required")
        for key in ["journeyStage", "revenueLeak", "evidenceType", "evaluation", "applicability", "severity", "serviceMapping"]:
            if item.get(key) in (None, "", []):
                errors.append(f"{cid}: {key} is required")
        if item.get("evaluation") not in {"deterministic", "model_judgment", "owner_data"}:
            errors.append(f"{cid}: invalid evaluation")
        if item.get("applicability") not in {"required", "recommended", "conditional"}:
            errors.append(f"{cid}: invalid applicability")
        if item.get("severity") not in {"critical", "high", "medium", "low"}:
            errors.append(f"{cid}: invalid severity")
        if item.get("applicability") == "conditional" and not item.get("module"):
            errors.append(f"{cid}: conditional item needs a module")

    for cat in cats:
        if by_cat[cat["id"]] != cat["max"]:
            errors.append(
                f"category {cat['id']}: item maxima {by_cat[cat['id']]} do not equal weight {cat['max']}"
            )

    journey = rubric.get("journey", [])
    if not journey:
        errors.append("journey is required")
    owner_ids = {o.get("id") for o in rubric.get("ownerData", [])}
    mapped = set()
    for stage in journey:
        for cid in stage.get("checks", []):
            if cid not in item_ids:
                errors.append(f"journey {stage.get('id')}: unknown check {cid}")
            mapped.add(cid)
        for oid in stage.get("ownerData", []):
            if oid not in owner_ids:
                errors.append(f"journey {stage.get('id')}: unknown ownerData {oid}")
    for cid in item_ids:
        if cid not in mapped:
            errors.append(f"{cid}: not mapped to a journey stage")

    owner_stages = {o.get("journeyStage") for o in rubric.get("ownerData", [])}
    stage_ids = {s.get("id") for s in journey}
    for stage in owner_stages:
        if stage not in stage_ids:
            errors.append(f"ownerData references unknown stage {stage}")

    modules = {m.get("id") for m in rubric.get("optionalModules", [])}
    for item in rubric.get("items", []):
        if item.get("module") and item["module"] not in modules:
            errors.append(f"{item.get('id')}: unknown module {item['module']}")
    for module in rubric.get("optionalModules", []):
        for cid in module.get("checks", []):
            if cid not in item_ids:
                errors.append(f"module {module.get('id')}: unknown check {cid}")
            else:
                item = next(i for i in rubric["items"] if i["id"] == cid)
                if item.get("module") != module.get("id"):
                    errors.append(f"module {module.get('id')}: {cid} does not declare this module")
        if not module.get("scored") and module.get("checks"):
            errors.append(f"module {module.get('id')}: unscored modules must not list scored checks")

    caps = rubric.get("caps", [])
    if len({c.get("id") for c in caps}) != len(caps):
        errors.append("cap ids must be unique")
    for cap in caps:
        if not isinstance(cap.get("max"), int) or not 0 <= cap["max"] <= 100:
            errors.append(f"cap {cap.get('id')}: max must be 0-100")

    return errors


def validate_v1(rubric: dict) -> list[str]:
    errors = []
    if sum(c.get("max", 0) for c in rubric.get("categories", [])) != 100:
        errors.append("category maxima must sum to 100")
    ids = [i.get("id") for i in rubric.get("items", [])]
    if len(set(ids)) != len(ids):
        errors.append("item ids must be unique")
    for item in rubric.get("items", []):
        if item.get("max") not in item.get("allowed", []) and not item.get("split"):
            errors.append(f"{item.get('id')}: allowed must include max")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a rubric JSON file.")
    parser.add_argument("--rubric", default=str(DEFAULT_RUBRIC))
    args = parser.parse_args()
    try:
        rubric = json.loads(Path(args.rubric).read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"error: rubric not found: {args.rubric}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as exc:
        print(f"error: invalid JSON: {exc}", file=sys.stderr)
        return 2

    v2 = rubric.get("schema_version") == "2.0" or rubric.get("framework") == "revenue-leak"
    errors = validate_v2(rubric) if v2 else validate_v1(rubric)
    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1
    counts = Counter(i.get("applicability") for i in rubric.get("items", []))
    print(
        f"ok: rubric v{rubric.get('version')} · {len(rubric.get('items', []))} checks · "
        f"{len(rubric.get('journey', []))} journey stages · {len(rubric.get('ownerData', []))} owner-data prompts · "
        f"{dict(counts)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
