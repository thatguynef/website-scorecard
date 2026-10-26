#!/usr/bin/env python3
"""Score a Website Revenue Leak Scorecard audit.

Supports two rubric schemas:

* ``1.x`` -- the legacy 42-check Hormozi rubric. Scoring is a direct point sum.
* ``2.x`` -- the applicability-aware Revenue Leak Framework. Optional modules are
  excluded from the denominator and category weights are normalized so a score
  still means "out of 100" without inflating a site that simply has fewer
  applicable checks.

The scorer never invents a judgment. Every applicable check must already have a
score, evidence, and a confidence state.

Usage:
  python3 score.py --input audit.filled.json --out scores.json --strict
  python3 score.py --input audit.filled.json --markdown scorecard.md
  python3 score.py --help
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCORER_VERSION = "2.0.0"
DEFAULT_RUBRIC = Path(__file__).resolve().parent.parent / "references" / "rubric.json"
EVIDENCE_STATES = {"verified", "strong_signal", "owner_data_required", "not_applicable"}
SCORED_CONFIDENCE = {"verified", "strong_signal"}


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def index_items(rubric: dict) -> dict:
    return {item["id"]: item for item in rubric["items"]}


def is_v2(rubric: dict) -> bool:
    return rubric.get("schema_version") == "2.0" or rubric.get("framework") == "revenue-leak"


def configuration(audit: dict) -> dict:
    """Return the audit configuration with safe defaults."""
    config = dict((audit.get("meta") or {}).get("configuration") or {})
    config.setdefault("optionalChecks", {})
    config.setdefault("excludedChecks", [])
    config.setdefault("preferredLanguages", ["en"])
    return config


def applicability(item: dict, config: dict) -> tuple[bool, str]:
    """Return (applicable, reason_if_not).

    Required checks can never be excluded. Recommended checks are scored unless
    the configuration explicitly excludes them. Conditional checks are scored
    only when their module is enabled.
    """
    level = item.get("applicability", "required")
    if level == "required":
        return True, ""

    if level == "recommended":
        if item["id"] in (config.get("excludedChecks") or []):
            return False, "excluded by configuration.excludedChecks"
        return True, ""

    if level == "conditional":
        module = item.get("module")
        optional = config.get("optionalChecks") or {}
        if module == "language_access":
            languages = config.get("preferredLanguages") or ["en"]
            default = len(languages) > 1
            if isinstance(optional.get(module), bool):
                return optional[module], "" if optional[module] else "multilingual access not configured for this market"
            return default, "" if default else "multilingual access not configured for this market"
        if module and isinstance(optional.get(module), bool):
            return optional[module], "" if optional[module] else f"optional module disabled: {module}"
        default = bool(item.get("defaultApplicable", False))
        return default, "" if default else f"optional module disabled: {module or 'conditional'}"

    return True, ""


def validate_v1(audit: dict, rubric: dict) -> tuple[list[str], list[str]]:
    checks = audit.get("checks") or {}
    items = index_items(rubric)
    missing: list[str] = []
    errors: list[str] = []

    unknown = sorted(set(checks) - set(items))
    for cid in unknown:
        errors.append(f"{cid}: unknown check id")

    for cid, item in items.items():
        check = checks.get(cid)
        if not check or check.get("score") is None:
            missing.append(cid)
            continue

        score = check["score"]
        if not isinstance(score, int) or isinstance(score, bool):
            errors.append(f"{cid}: score must be an integer")
            continue

        split = item.get("split")
        if split:
            subs = check.get("subscores") or {}
            for viewport, max_points in split.items():
                if viewport not in subs:
                    errors.append(f"{cid}: missing {viewport} subscore")
                    continue
                value = subs[viewport]
                allowed = item["allowed"][viewport]
                if value not in allowed:
                    errors.append(f"{cid}: {viewport} subscore {value} not in {allowed}")
                if value > max_points:
                    errors.append(f"{cid}: {viewport} subscore {value} exceeds {max_points}")
            if not any(e.startswith(f"{cid}:") for e in errors):
                if sum(subs.values()) != score:
                    errors.append(f"{cid}: subscores {subs} do not sum to score {score}")
        else:
            if score not in item["allowed"]:
                errors.append(f"{cid}: score {score} not in {item['allowed']}")
            if score > item["max"]:
                errors.append(f"{cid}: score {score} exceeds max {item['max']}")

        if not check.get("evidence"):
            errors.append(f"{cid}: evidence is required")

    meta_version = (audit.get("meta") or {}).get("rubric_version")
    if not meta_version:
        errors.append("meta.rubric_version is required")
    elif meta_version != rubric.get("version"):
        errors.append(
            f"meta.rubric_version {meta_version} does not match rubric {rubric.get('version')}"
        )

    caps = audit.get("caps") or {}
    valid_caps = {cap["id"] for cap in rubric["caps"]}
    for cap_id in caps:
        if cap_id not in valid_caps:
            errors.append(f"caps: unknown cap id {cap_id}")

    return missing, errors


def validate_v2(audit: dict, rubric: dict) -> tuple[list[str], list[str]]:
    checks = audit.get("checks") or {}
    items = index_items(rubric)
    config = configuration(audit)
    missing: list[str] = []
    errors: list[str] = []

    unknown = sorted(set(checks) - set(items))
    for cid in unknown:
        errors.append(f"{cid}: unknown check id")

    for cid, item in items.items():
        check = checks.get(cid)
        if not check:
            missing.append(cid)
            continue
        if not isinstance(check, dict):
            errors.append(f"{cid}: check must be an object")
            continue

        if check.get("needs_review") is True:
            errors.append(f"{cid}: needs_review must be false in a scored audit")

        applies, reason = applicability(item, config)
        declared = check.get("applicable")
        if isinstance(declared, bool) and declared != applies:
            errors.append(
                f"{cid}: applicable={declared} conflicts with configuration ({applies})"
            )

        score = check.get("score")
        if not applies:
            if score is not None:
                errors.append(f"{cid}: N/A check must have score=null")
            if not check.get("na_reason") and not reason:
                errors.append(f"{cid}: N/A check needs na_reason")
            confidence = check.get("confidence")
            if confidence != "not_applicable":
                errors.append(f"{cid}: N/A confidence must be not_applicable")
            continue

        if score is None:
            missing.append(cid)
            continue
        if not isinstance(score, int) or isinstance(score, bool):
            errors.append(f"{cid}: score must be an integer")
            continue
        if score not in item["allowed"]:
            errors.append(f"{cid}: score {score} not in {item['allowed']}")
        if score > item["max"]:
            errors.append(f"{cid}: score {score} exceeds max {item['max']}")

        evidence = check.get("evidence")
        if not evidence:
            errors.append(f"{cid}: evidence is required for a scored check")
        elif not isinstance(evidence, list):
            errors.append(f"{cid}: evidence must be an array")

        confidence = check.get("confidence")
        if confidence not in SCORED_CONFIDENCE:
            errors.append(
                f"{cid}: confidence must be one of {sorted(SCORED_CONFIDENCE)}"
            )

    meta = audit.get("meta") or {}
    meta_version = meta.get("rubric_version")
    if not meta_version:
        errors.append("meta.rubric_version is required")
    elif meta_version != rubric.get("version"):
        errors.append(
            f"meta.rubric_version {meta_version} does not match rubric {rubric.get('version')}"
        )
    if not meta.get("collector_version"):
        errors.append("meta.collector_version is required")
    if not (meta.get("run_timestamp") or meta.get("generated_at")):
        errors.append("meta.run_timestamp is required")

    caps = audit.get("caps") or {}
    valid_caps = {cap["id"] for cap in rubric["caps"]}
    for cap_id in caps:
        if cap_id not in valid_caps:
            errors.append(f"caps: unknown cap id {cap_id}")

    module_ids = {m["id"] for m in rubric.get("optionalModules", [])}
    for key in (config.get("optionalChecks") or {}):
        if key not in module_ids:
            errors.append(f"configuration.optionalChecks: unknown module {key}")
    languages = config.get("preferredLanguages")
    if not isinstance(languages, list) or not languages:
        errors.append("configuration.preferredLanguages must be a non-empty array")

    excluded = config.get("excludedChecks") or []
    recommended = {i["id"] for i in rubric["items"] if i.get("applicability") == "recommended"}
    for cid in excluded:
        if cid not in items:
            errors.append(f"configuration.excludedChecks: unknown check id {cid}")
        elif cid not in recommended:
            errors.append(f"configuration.excludedChecks: {cid} is not a recommended check")

    owner_ids = {entry["id"] for entry in rubric.get("ownerData", [])}
    for entry in audit.get("ownerData") or []:
        oid = entry.get("id") if isinstance(entry, dict) else None
        if oid and oid not in owner_ids:
            errors.append(f"ownerData: unknown id {oid}")

    for leak in audit.get("topLeaks") or []:
        if not isinstance(leak, dict):
            continue
        confidence = leak.get("confidence")
        if confidence not in EVIDENCE_STATES:
            errors.append("topLeaks: confidence must be verified, strong_signal, owner_data_required, or not_applicable")
        cid = leak.get("checkId")
        if cid and cid not in items:
            errors.append(f"topLeaks: unknown checkId {cid}")
        oid = leak.get("ownerDataId")
        if oid and oid not in owner_ids:
            errors.append(f"topLeaks: unknown ownerDataId {oid}")
        if confidence == "owner_data_required" and not oid:
            errors.append("topLeaks: owner_data_required needs an ownerDataId")
        if confidence in {"verified", "strong_signal"} and not cid:
            errors.append("topLeaks: a verified or strong-signal leak needs a checkId")

    return missing, errors


def validate(audit: dict, rubric: dict) -> tuple[list[str], list[str]]:
    if is_v2(rubric):
        return validate_v2(audit, rubric)
    return validate_v1(audit, rubric)


def band_for(score: int | float, rubric: dict) -> dict:
    for entry in sorted(rubric["bands"], key=lambda b: b["min"], reverse=True):
        if score >= entry["min"]:
            return entry
    return rubric["bands"][-1]


def compute_v1(audit: dict, rubric: dict) -> dict:
    checks = audit.get("checks") or {}
    items = rubric["items"]

    categories = {
        cat["id"]: {
            "id": cat["id"],
            "name": cat["name"],
            "earned": 0,
            "max": cat["max"],
        }
        for cat in rubric["categories"]
    }

    recoverable = []
    for item in items:
        check = checks.get(item["id"]) or {}
        if not isinstance(check, dict):
            check = {}
        score = check.get("score") or 0
        categories[item["cat"]]["earned"] += score
        if item["max"] - score > 0:
            recoverable.append(
                {
                    "id": item["id"],
                    "title": item["title"],
                    "lost": item["max"] - score,
                    "max": item["max"],
                }
            )

    total = sum(c["earned"] for c in categories.values())

    active_caps = []
    for cap in rubric["caps"]:
        if (audit.get("caps") or {}).get(cap["id"]):
            active_caps.append(cap)
    cap = min([c["max"] for c in active_caps], default=100)
    final = min(total, cap)
    band = band_for(final, rubric)

    return {
        "schema_version": "1.0",
        "framework": "hormozi-42",
        "meta": audit.get("meta") or {},
        "rubric_version": rubric.get("version"),
        "scorer_version": SCORER_VERSION,
        "categories": list(categories.values()),
        "total": total,
        "total_max": rubric["total"],
        "percent": round(100 * final / rubric["total"], 1),
        "cap": cap,
        "cap_active": bool(active_caps),
        "cap_binding": final < total,
        "cap_applied": bool(active_caps),
        "caps": active_caps,
        "final": final,
        "display": final,
        "band": band["band"],
        "band_label": band["label"],
        "recoverable": sorted(recoverable, key=lambda r: (-r["lost"], r["id"])),
    }


def compute_v2(audit: dict, rubric: dict) -> dict:
    checks = audit.get("checks") or {}
    config = configuration(audit)
    categories = []
    findings = []
    recoverable = []
    coverage = []
    checks_out = []

    for cat in rubric["categories"]:
        cat_items = [i for i in rubric["items"] if i["cat"] == cat["id"]]
        applicable_max = 0
        earned = 0
        na_items = []
        for item in cat_items:
            applies, reason = applicability(item, config)
            check = checks.get(item["id"]) or {}
            if not isinstance(check, dict):
                check = {}
            if not applies:
                na_items.append(item["id"])
                coverage.append(coverage_row(item, applies, reason))
                checks_out.append(check_row(item, check, applies, reason))
                continue
            applicable_max += item["max"]
            score = check.get("score") or 0
            earned += score
            lost = item["max"] - score
            if lost > 0:
                recoverable.append(
                    {
                        "id": item["id"],
                        "title": item["title"],
                        "lost": lost,
                        "max": item["max"],
                        "stage": item.get("journeyStage"),
                        "severity": item.get("severity"),
                        "recommendedIntervention": item.get("recommendedIntervention"),
                        "serviceMapping": item.get("serviceMapping"),
                    }
                )
            findings.append(
                {
                    "id": item["id"],
                    "title": item["title"],
                    "score": score,
                    "max": item["max"],
                    "lost": lost,
                    "stage": item.get("journeyStage"),
                    "severity": item.get("severity"),
                    "confidence": check.get("confidence"),
                    "evaluation": item.get("evaluation"),
                    "recommendedIntervention": item.get("recommendedIntervention"),
                    "serviceMapping": item.get("serviceMapping"),
                    "evidence": check.get("evidence") or [],
                }
            )
            coverage.append(coverage_row(item, applies, reason))
            checks_out.append(check_row(item, check, applies, reason))

        normalized = round(cat["max"] * earned / applicable_max, 2) if applicable_max else 0.0
        categories.append(
            {
                "id": cat["id"],
                "name": cat["name"],
                "question": cat.get("question", ""),
                "earned": earned,
                "max": cat["max"],
                "applicable_max": applicable_max,
                "normalized": normalized,
                "applicable": applicable_max > 0,
                "na_items": na_items,
                "percent": round(100 * earned / applicable_max, 1) if applicable_max else None,
            }
        )

    applicable_weight = sum(c["max"] for c in categories if c["applicable"])
    raw_total = sum(c["normalized"] for c in categories)
    total = round(raw_total * 100 / applicable_weight, 1) if applicable_weight else 0.0

    active_caps = [cap for cap in rubric["caps"] if (audit.get("caps") or {}).get(cap["id"])]
    cap = min([c["max"] for c in active_caps], default=100)
    final = round(min(total, cap), 1)
    display = int(round(final))
    band = band_for(display, rubric)

    journey = []
    for stage in rubric.get("journey", []):
        stage_checks = [i for i in rubric["items"] if i["id"] in stage.get("checks", [])]
        applicable = [i for i in stage_checks if applicability(i, config)[0]]
        stage_max = sum(i["max"] for i in applicable)
        stage_earned = sum((checks.get(i["id"]) or {}).get("score") or 0 for i in applicable)
        if not applicable:
            status = "owner_data_required" if stage.get("ownerData") else "observed_unscored"
        elif stage.get("ownerData"):
            status = "scored_plus_owner_data"
        else:
            status = "scored"
        journey.append(
            {
                "id": stage["id"],
                "order": stage["order"],
                "label": stage["label"],
                "customerQuestion": stage.get("customerQuestion", ""),
                "status": status,
                "checks": [i["id"] for i in applicable],
                "na_checks": [i["id"] for i in stage_checks if i not in applicable],
                "ownerData": stage.get("ownerData", []),
                "earned": stage_earned,
                "max": stage_max,
                "percent": round(100 * stage_earned / stage_max, 1) if stage_max else None,
            }
        )

    owner_required = []
    for entry in rubric.get("ownerData", []):
        owner_required.append(
            {
                "id": entry["id"],
                "stage": entry.get("journeyStage"),
                "title": entry["title"],
                "confidence": "owner_data_required",
                "serviceMapping": entry.get("serviceMapping"),
                "whyItMatters": entry.get("whyItMatters", ""),
                "questions": entry.get("questions", []),
            }
        )

    meta = dict(audit.get("meta") or {})
    meta["scorer_version"] = SCORER_VERSION

    return {
        "schema_version": "2.0",
        "framework": "revenue-leak",
        "meta": meta,
        "rubric_version": rubric.get("version"),
        "rubric_title": rubric.get("title", "Website Revenue Leak Scorecard"),
        "scorer_version": SCORER_VERSION,
        "categories": categories,
        "checks": checks_out,
        "findings": findings,
        "verifiedFindings": [f for f in findings if f["confidence"] == "verified" and f["lost"] > 0],
        "strongSignals": [f for f in findings if f["confidence"] == "strong_signal" and f["lost"] > 0],
        "recommendations": sorted(recoverable, key=lambda r: (-r["lost"], r["id"])),
        "evidence": [
            {
                "checkId": row["id"],
                "confidence": row["confidence"],
                "items": row["evidence"],
            }
            for row in checks_out
            if row["applicable"]
        ],
        "topLeaks": audit.get("topLeaks") or [],
        "ownerDataRequired": owner_required,
        "journey": journey,
        "coverage": coverage,
        "serviceMappings": rubric.get("serviceMappings", []),
        "normalization": {
            "method": rubric.get("scoring", {}).get("model", "applicability_aware_category_normalization"),
            "applicable_weight": applicable_weight,
            "raw_total": round(raw_total, 2),
            "na_checks": [c["id"] for c in coverage if not c["applicable"]],
        },
        "total": total,
        "total_max": rubric["total"],
        "percent": final,
        "cap": cap,
        "cap_active": bool(active_caps),
        "cap_binding": final < total,
        "cap_applied": bool(active_caps),
        "caps": active_caps,
        "final": final,
        "display": display,
        "band": band["band"],
        "band_label": band["label"],
        "recoverable": sorted(recoverable, key=lambda r: (-r["lost"], r["id"])),
    }


def coverage_row(item: dict, applies: bool, reason: str) -> dict:
    return {
        "id": item["id"],
        "name": item["title"],
        "category": item["cat"],
        "journeyStage": item.get("journeyStage"),
        "revenueLeakCategory": item.get("revenueLeak"),
        "evidenceType": item.get("evidenceType", []),
        "evaluation": item.get("evaluation"),
        "applicability": item.get("applicability"),
        "applicable": applies,
        "naReason": "" if applies else reason,
        "severity": item.get("severity"),
        "confidence": "not_applicable" if not applies else ("verified" if item.get("evaluation") == "deterministic" else "verified_or_strong_signal"),
        "recommendedIntervention": item.get("recommendedIntervention"),
        "serviceMapping": item.get("serviceMapping"),
        "scoring": "scored" if applies else "excluded",
    }


def check_row(item: dict, check: dict, applies: bool, reason: str) -> dict:
    return {
        "id": item["id"],
        "title": item["title"],
        "category": item["cat"],
        "stage": item.get("journeyStage"),
        "max": item["max"],
        "score": check.get("score") if applies else None,
        "applicable": applies,
        "na_reason": "" if applies else (check.get("na_reason") or reason),
        "confidence": check.get("confidence") if applies else "not_applicable",
        "evidence": check.get("evidence") or [],
        "evaluation": item.get("evaluation"),
        "severity": item.get("severity"),
        "recommendedIntervention": item.get("recommendedIntervention"),
        "serviceMapping": item.get("serviceMapping"),
    }


def compute(audit: dict, rubric: dict) -> dict:
    if is_v2(rubric):
        return compute_v2(audit, rubric)
    return compute_v1(audit, rubric)


def scorecard_markdown_v1(result: dict) -> str:
    meta = result["meta"]
    lines = []
    lines.append(f"# Scorecard — {meta.get('client', 'Client')}")
    lines.append("")
    if meta.get("url"):
        lines.append(f"**URL:** {meta['url']}")
    if meta.get("date"):
        lines.append(f"**Date:** {meta['date']}")
    if result.get("rubric_version"):
        lines.append(f"**Rubric:** v{result['rubric_version']}")
    lines.append("")
    lines.append(f"**Score:** {result['final']} / {result['total_max']} — {result['band']} ({result['band_label']})")
    if result["total"] != result["final"]:
        lines.append(
            f"**Cap applied:** raw {result['total']} capped at {result['cap']} "
            f"({', '.join(c['label'] for c in result['caps'])})"
        )
    lines.append("")
    lines.append("| Category | Earned | Available | % |")
    lines.append("|---|---|---|---|")
    for cat in result["categories"]:
        pct = round(100 * cat["earned"] / cat["max"], 0) if cat["max"] else 0
        lines.append(f"| {cat['id']}. {cat['name']} | {cat['earned']} | {cat['max']} | {pct:.0f}% |")
    lines.append(f"| **Total** | **{result['final']}** | **{result['total_max']}** | **{result['percent']:.0f}%** |")
    lines.append("")
    return "\n".join(lines)


def scorecard_markdown_v2(result: dict) -> str:
    meta = result["meta"]
    lines = [
        f"# Website Revenue Leak Scorecard — {meta.get('client', 'Client')}",
        "",
    ]
    if meta.get("url"):
        lines.append(f"**URL:** {meta['url']}")
    if meta.get("date"):
        lines.append(f"**Date:** {meta['date']}")
    lines.append(f"**Rubric:** v{result['rubric_version']} · **Collector:** v{meta.get('collector_version', 'unknown')} · **Scorer:** v{result['scorer_version']}")
    lines.append("")
    lines.append(
        f"**Score: {result['display']} / {result['total_max']} — {result['band']} ({result['band_label']})**"
    )
    if result["cap_binding"]:
        lines.append(
            f"**Cap applied:** raw {result['total']} capped at {result['cap']} "
            f"({', '.join(c['label'] for c in result['caps'])})"
        )
    elif result["cap_active"]:
        lines.append(f"**Cap flag active but not binding:** {result['cap']}")
    if result["normalization"]["na_checks"]:
        lines.append(
            f"**Excluded as N/A:** {', '.join(result['normalization']['na_checks'])} "
            "(category weights normalized to 100)"
        )
    lines.append("")
    lines.append("| Category | Earned | Applicable | Weight | Normalized | % |")
    lines.append("|---|---|---|---|---|---|")
    for cat in result["categories"]:
        pct = f"{cat['percent']:.0f}%" if cat["percent"] is not None else "N/A"
        lines.append(
            f"| {cat['id']}. {cat['name']} | {cat['earned']} | {cat['applicable_max']} | "
            f"{cat['max']} | {cat['normalized']:.2f} | {pct} |"
        )
    lines.append(
        f"| **Total** | **{result['final']}** | **100** | **100** | **{result['total']:.2f}** | **{result['final']:.0f}%** |"
    )
    lines.append("")
    if result["verifiedFindings"]:
        lines.append("## Verified findings first")
        lines.append("")
        for finding in result["verifiedFindings"][:10]:
            lines.append(
                f"- **{finding['id']} {finding['title']}** — {finding['score']}/{finding['max']} "
                f"({finding['stage']}, {finding['severity']})"
            )
        lines.append("")
    if result["ownerDataRequired"]:
        lines.append("## Revenue opportunities to investigate (owner data required)")
        lines.append("")
        for entry in result["ownerDataRequired"]:
            lines.append(f"- **{entry['title']}** — {entry['whyItMatters']}")
        lines.append("")
    return "\n".join(lines)


def scorecard_markdown(result: dict) -> str:
    if result.get("schema_version") == "2.0":
        return scorecard_markdown_v2(result)
    return scorecard_markdown_v1(result)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Score a Website Revenue Leak Scorecard audit (V1 and V2 rubrics).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""examples:
  python3 score.py --input audit.filled.json --out scores.json --strict
  python3 score.py --input audit.filled.json --markdown scorecard.md
  python3 score.py --input fixture.json --rubric references/legacy/rubric-v1.1.3.json --strict
""",
    )
    parser.add_argument("--input", required=True, help="Path to the filled audit JSON")
    parser.add_argument("--out", help="Write the scores JSON here")
    parser.add_argument("--markdown", help="Write a scorecard Markdown file here")
    parser.add_argument("--rubric", default=str(DEFAULT_RUBRIC), help="Rubric JSON (default: references/rubric.json)")
    parser.add_argument("--strict", action="store_true", help="Fail on missing checks, invalid scores, N/A errors, or missing evidence")
    parser.add_argument("--version", action="version", version=f"%(prog)s {SCORER_VERSION}")
    args = parser.parse_args()

    try:
        rubric = load_json(Path(args.rubric))
        audit = load_json(Path(args.input))
    except FileNotFoundError as exc:
        print(f"error: file not found: {exc.filename}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as exc:
        print(f"error: invalid JSON: {exc}", file=sys.stderr)
        return 2

    missing, errors = validate(audit, rubric)
    if missing:
        errors = [f"missing check: {cid}" for cid in missing] + errors

    if errors and args.strict:
        for err in errors:
            print(f"error: {err}", file=sys.stderr)
        return 1

    result = compute(audit, rubric)
    result["missing"] = missing
    result["errors"] = errors
    result["complete"] = not missing and not errors

    payload = json.dumps(result, indent=2)
    if args.out:
        Path(args.out).write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)

    if args.markdown:
        Path(args.markdown).write_text(scorecard_markdown(result).rstrip() + "\n", encoding="utf-8")

    if errors and not args.strict:
        for err in errors:
            print(f"warning: {err}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
