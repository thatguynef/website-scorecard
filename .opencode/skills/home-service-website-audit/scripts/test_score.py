#!/usr/bin/env python3
"""Tests for the V1 and V2 scorers.

Run:
  python3 -m unittest discover -s .opencode/skills/home-service-website-audit/scripts -p 'test_*.py'
"""

import copy
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from score import compute, load_json, scorecard_markdown, validate  # noqa: E402

RUBRIC = load_json(HERE.parent / "references" / "rubric.json")
LEGACY_RUBRIC = load_json(HERE.parent / "references" / "legacy" / "rubric-v1.1.3.json")
LEGACY_A = load_json(HERE / "fixtures" / "legacy-roofing-a-v1.audit.json")
LEGACY_B = load_json(HERE / "fixtures" / "legacy-roofing-b-v1.audit.json")
ACME = load_json(HERE / "fixtures" / "acme-plumbing-v2.audit.json")


def legacy_full_audit(rubric):
    checks = {}
    for item in rubric["items"]:
        if item.get("split"):
            subs = dict(item["split"])
            checks[item["id"]] = {
                "score": sum(subs.values()),
                "subscores": subs,
                "evidence": ["fixture"],
            }
        else:
            checks[item["id"]] = {"score": item["max"], "evidence": ["fixture"]}
    return {
        "meta": {"client": "Full", "rubric_version": rubric["version"]},
        "checks": checks,
        "caps": {},
    }


def legacy_zero_audit(rubric):
    checks = {}
    for item in rubric["items"]:
        entry = {"score": 0, "evidence": ["fixture"]}
        if item.get("split"):
            entry["subscores"] = {k: 0 for k in item["split"]}
        checks[item["id"]] = entry
    return {
        "meta": {"client": "Zero", "rubric_version": rubric["version"]},
        "checks": checks,
        "caps": {},
    }


def v2_meta(rubric, configuration=None):
    return {
        "client": "Synthetic Test Co.",
        "url": "https://example.test/",
        "date": "2026-10-26",
        "rubric_version": rubric["version"],
        "collector_version": "2.0.0",
        "run_timestamp": "2026-10-26T10:00:00Z",
        "synthetic": True,
        "configuration": configuration
        or {
            "preferredLanguages": ["en", "es"],
            "optionalChecks": {
                "language_access": True,
                "sms": True,
                "chat_callback": True,
                "after_hours": True,
                "licensing": True,
            },
            "excludedChecks": [],
        },
    }


def v2_full_audit(rubric, configuration=None):
    checks = {}
    for item in rubric["items"]:
        checks[item["id"]] = {
            "score": item["max"],
            "evidence": ["fixture"],
            "confidence": "verified",
            "applicable": True,
        }
    return {
        "meta": v2_meta(rubric, configuration),
        "checks": checks,
        "caps": {cap["id"]: False for cap in rubric["caps"]},
    }


def v2_zero_audit(rubric, configuration=None):
    checks = {}
    for item in rubric["items"]:
        checks[item["id"]] = {
            "score": 0,
            "evidence": ["fixture: not observed"],
            "confidence": "verified",
            "applicable": True,
        }
    return {
        "meta": v2_meta(rubric, configuration),
        "checks": checks,
        "caps": {cap["id"]: False for cap in rubric["caps"]},
    }


class LegacyV1Tests(unittest.TestCase):
    def test_legacy_roofing_a_golden(self):
        missing, errors = validate(LEGACY_A, LEGACY_RUBRIC)
        self.assertEqual(missing, [])
        self.assertEqual(errors, [])
        result = compute(LEGACY_A, LEGACY_RUBRIC)
        self.assertEqual(result["total"], 36)
        self.assertEqual(result["final"], 36)
        self.assertEqual(result["cap"], 50)
        self.assertEqual(result["band"], "F")
        self.assertEqual(result["percent"], 36.0)
        cats = {c["id"]: c["earned"] for c in result["categories"]}
        self.assertEqual(cats, {"A": 10, "B": 8, "C": 7, "D": 0, "E": 8, "F": 3, "G": 0})

    def test_legacy_roofing_b_golden(self):
        missing, errors = validate(LEGACY_B, LEGACY_RUBRIC)
        self.assertEqual((missing, errors), ([], []))
        result = compute(LEGACY_B, LEGACY_RUBRIC)
        self.assertEqual(result["total"], 41)
        self.assertEqual(result["final"], 41)
        self.assertEqual(result["cap"], 60)
        self.assertEqual(result["band"], "D")
        cats = {c["id"]: c["earned"] for c in result["categories"]}
        self.assertEqual(cats, {"A": 10, "B": 8, "C": 9, "D": 0, "E": 4, "F": 8, "G": 2})

    def test_legacy_all_full_is_100(self):
        audit = legacy_full_audit(LEGACY_RUBRIC)
        missing, errors = validate(audit, LEGACY_RUBRIC)
        self.assertEqual((missing, errors), ([], []))
        result = compute(audit, LEGACY_RUBRIC)
        self.assertEqual(result["final"], 100)
        self.assertEqual(result["band"], "A")
        self.assertFalse(result["cap_applied"])

    def test_legacy_all_zero_is_zero(self):
        audit = legacy_zero_audit(LEGACY_RUBRIC)
        result = compute(audit, LEGACY_RUBRIC)
        self.assertEqual(result["final"], 0)
        self.assertEqual(result["band"], "F")

    def test_legacy_broken_cta_caps_at_50(self):
        audit = legacy_full_audit(LEGACY_RUBRIC)
        audit["caps"] = {"broken_cta": True}
        result = compute(audit, LEGACY_RUBRIC)
        self.assertEqual(result["total"], 100)
        self.assertEqual(result["final"], 50)
        self.assertEqual(result["band"], "D")

    def test_legacy_no_contact_caps_at_30(self):
        audit = legacy_full_audit(LEGACY_RUBRIC)
        audit["caps"] = {"no_contact": True}
        result = compute(audit, LEGACY_RUBRIC)
        self.assertEqual(result["final"], 30)
        self.assertEqual(result["band"], "F")

    def test_legacy_missing_check(self):
        audit = copy.deepcopy(LEGACY_A)
        del audit["checks"]["A1"]
        missing, errors = validate(audit, LEGACY_RUBRIC)
        self.assertIn("A1", missing)
        self.assertEqual(errors, [])

    def test_legacy_invalid_score(self):
        audit = copy.deepcopy(LEGACY_A)
        audit["checks"]["A1"]["score"] = 3
        missing, errors = validate(audit, LEGACY_RUBRIC)
        self.assertTrue(any("A1" in e for e in errors))

    def test_legacy_split_mismatch(self):
        audit = copy.deepcopy(LEGACY_A)
        audit["checks"]["A7"]["score"] = 2
        audit["checks"]["A7"]["subscores"] = {"mobile": 3, "desktop": 0}
        missing, errors = validate(audit, LEGACY_RUBRIC)
        self.assertTrue(any("A7" in e and "sum" in e for e in errors))

    def test_legacy_split_valid(self):
        audit = copy.deepcopy(LEGACY_A)
        audit["checks"]["A7"]["score"] = 3
        audit["checks"]["A7"]["subscores"] = {"mobile": 2, "desktop": 1}
        missing, errors = validate(audit, LEGACY_RUBRIC)
        self.assertEqual((missing, errors), ([], []))

    def test_legacy_unknown_cap(self):
        audit = copy.deepcopy(LEGACY_A)
        audit["caps"]["made_up"] = True
        missing, errors = validate(audit, LEGACY_RUBRIC)
        self.assertTrue(any("made_up" in e for e in errors))

    def test_legacy_markdown_has_total(self):
        result = compute(LEGACY_A, LEGACY_RUBRIC)
        md = scorecard_markdown(result)
        self.assertIn("36 / 100", md)
        self.assertIn("| **Total** | **36** | **100** |", md)


class RevenueLeakV2Tests(unittest.TestCase):
    def test_acme_golden(self):
        missing, errors = validate(ACME, RUBRIC)
        self.assertEqual(missing, [])
        self.assertEqual(errors, [])
        result = compute(ACME, RUBRIC)
        self.assertEqual(result["total"], 68.1)
        self.assertEqual(result["final"], 68.1)
        self.assertEqual(result["display"], 68)
        self.assertEqual(result["band"], "C")
        self.assertEqual(result["normalization"]["applicable_weight"], 100)
        cats = {c["id"]: (c["earned"], c["applicable_max"], c["normalized"]) for c in result["categories"]}
        self.assertEqual(cats["A"], (13, 18, 14.44))
        self.assertEqual(cats["B"], (17, 20, 18.7))
        self.assertEqual(cats["C"], (11, 16, 11.0))
        self.assertEqual(cats["D"], (9, 15, 9.0))
        self.assertEqual(cats["E"], (8, 15, 8.0))
        self.assertEqual(cats["F"], (5, 8, 5.0))
        self.assertEqual(cats["G"], (2, 4, 2.0))
        self.assertEqual(result["normalization"]["na_checks"], ["RL-UND-08", "RL-CON-03", "RL-CON-09"])

    def test_v2_all_full_is_100(self):
        audit = v2_full_audit(RUBRIC)
        missing, errors = validate(audit, RUBRIC)
        self.assertEqual((missing, errors), ([], []))
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], 100)
        self.assertEqual(result["band"], "A")
        self.assertFalse(result["cap_binding"])

    def test_v2_all_zero_is_zero(self):
        audit = v2_zero_audit(RUBRIC)
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], 0)
        self.assertEqual(result["band"], "F")

    def test_required_check_cannot_be_na(self):
        audit = copy.deepcopy(ACME)
        audit["checks"]["RL-UND-01"]["score"] = None
        audit["checks"]["RL-UND-01"]["applicable"] = False
        audit["checks"]["RL-UND-01"]["confidence"] = "not_applicable"
        audit["checks"]["RL-UND-01"]["na_reason"] = "I do not want to score it"
        missing, errors = validate(audit, RUBRIC)
        self.assertIn("RL-UND-01", missing)
        self.assertTrue(any("RL-UND-01" in e and "conflicts" in e for e in errors))

    def test_conditional_na_is_excluded_and_normalized(self):
        audit = copy.deepcopy(ACME)
        audit["meta"]["configuration"]["optionalChecks"]["language_access"] = False
        missing, errors = validate(audit, RUBRIC)
        self.assertEqual((missing, errors), ([], []))
        result = compute(audit, RUBRIC)
        # A still has 18 applicable points; the language check is not a penalty.
        a_cat = next(c for c in result["categories"] if c["id"] == "A")
        self.assertEqual(a_cat["applicable_max"], 18)
        self.assertEqual(result["display"], 68)

    def test_enabling_language_changes_denominator(self):
        audit = copy.deepcopy(ACME)
        audit["meta"]["configuration"]["preferredLanguages"] = ["en", "es"]
        audit["meta"]["configuration"]["optionalChecks"]["language_access"] = True
        audit["checks"]["RL-UND-08"] = {
            "score": 2,
            "evidence": ["Spanish home and contact page are reachable in two taps."],
            "confidence": "verified",
            "applicable": True,
        }
        missing, errors = validate(audit, RUBRIC)
        self.assertEqual((missing, errors), ([], []))
        result = compute(audit, RUBRIC)
        a_cat = next(c for c in result["categories"] if c["id"] == "A")
        self.assertEqual(a_cat["earned"], 15)
        self.assertEqual(a_cat["applicable_max"], 20)
        self.assertEqual(a_cat["normalized"], 15.0)
        self.assertEqual(result["display"], 69)

    def test_all_conditional_na_still_normalizes_to_100(self):
        config = {
            "preferredLanguages": ["en"],
            "optionalChecks": {
                "language_access": False,
                "sms": False,
                "chat_callback": False,
                "after_hours": False,
                "licensing": False,
            },
            "excludedChecks": [],
        }
        audit = v2_full_audit(RUBRIC, config)
        for item in RUBRIC["items"]:
            if item.get("applicability") == "conditional":
                audit["checks"][item["id"]] = {
                    "score": None,
                    "evidence": [],
                    "confidence": "not_applicable",
                    "applicable": False,
                    "na_reason": "optional module disabled for test",
                }
        missing, errors = validate(audit, RUBRIC)
        self.assertEqual((missing, errors), ([], []))
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], 100)
        self.assertEqual(result["band"], "A")
        a_cat = next(c for c in result["categories"] if c["id"] == "A")
        self.assertLess(a_cat["applicable_max"], 20)

    def test_recommended_exclusion_requires_configuration(self):
        audit = copy.deepcopy(ACME)
        audit["checks"]["RL-UND-05"]["score"] = None
        audit["checks"]["RL-UND-05"]["applicable"] = False
        audit["checks"]["RL-UND-05"]["confidence"] = "not_applicable"
        audit["checks"]["RL-UND-05"]["na_reason"] = "price anchors are not relevant"
        missing, errors = validate(audit, RUBRIC)
        self.assertTrue(any("RL-UND-05" in e and "conflicts" in e for e in errors))
        audit["meta"]["configuration"]["excludedChecks"] = ["RL-UND-05"]
        missing, errors = validate(audit, RUBRIC)
        self.assertEqual((missing, errors), ([], []))

    def test_required_check_cannot_be_excluded(self):
        audit = copy.deepcopy(ACME)
        audit["meta"]["configuration"]["excludedChecks"] = ["RL-UND-01"]
        missing, errors = validate(audit, RUBRIC)
        self.assertTrue(any("RL-UND-01" in e and "not a recommended" in e for e in errors))

    def test_cap_broken_primary_contact(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["primary_contact_broken"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 50.0)
        self.assertEqual(result["display"], 50)
        self.assertEqual(result["band"], "D")

    def test_cap_mobile_unusable(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["mobile_unusable"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 55.0)
        self.assertEqual(result["band"], "D")

    def test_cap_booking_failure(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["booking_failure"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 60.0)
        self.assertEqual(result["band"], "C")

    def test_cap_unclear_offer(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["unclear_offer"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 65.0)
        self.assertEqual(result["band"], "C")

    def test_cap_https_failure(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["https_failure"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 40.0)
        self.assertEqual(result["band"], "D")

    def test_cap_malicious_redirect(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["malicious_redirect"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 20.0)
        self.assertEqual(result["band"], "F")


    def test_no_contact_cap(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["no_contact"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 30.0)
        self.assertEqual(result["band"], "F")

    def test_form_unusable_cap(self):
        audit = v2_full_audit(RUBRIC)
        audit["caps"]["form_unusable"] = True
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], 55.0)
        self.assertEqual(result["band"], "D")

    def test_phone_only_conversion_is_not_no_contact(self):
        audit = v2_full_audit(RUBRIC)
        audit["checks"]["RL-CON-01"]["score"] = 3
        audit["checks"]["RL-CON-02"]["score"] = 3
        audit["checks"]["RL-CON-04"]["score"] = 0
        audit["checks"]["RL-CON-07"]["score"] = 0
        result = compute(audit, RUBRIC)
        self.assertFalse(result["cap_binding"])
        self.assertLess(result["display"], 100)

    def test_form_only_conversion_is_not_no_contact(self):
        audit = v2_full_audit(RUBRIC)
        audit["checks"]["RL-CON-01"]["score"] = 0
        audit["checks"]["RL-CON-02"]["score"] = 0
        audit["checks"]["RL-CON-04"]["score"] = 3
        audit["checks"]["RL-CON-07"]["score"] = 0
        result = compute(audit, RUBRIC)
        self.assertFalse(result["cap_binding"])
        self.assertLess(result["display"], 100)

    def test_scheduler_flow_scores(self):
        audit = v2_full_audit(RUBRIC)
        audit["checks"]["RL-CON-07"]["score"] = 3
        audit["checks"]["RL-RSP-03"]["score"] = 3
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], 100)

    def test_missing_analytics_lowers_score_without_cap(self):
        audit = v2_full_audit(RUBRIC)
        audit["checks"]["RL-MSR-01"]["score"] = 0
        audit["checks"]["RL-MSR-02"]["score"] = 0
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], 96)
        self.assertFalse(result["cap_binding"])

    def test_excellent_site_with_unknown_internal_processes(self):
        audit = v2_full_audit(RUBRIC)
        audit["ownerData"] = [{"id": "OD-ESTIMATE-FOLLOWUP", "note": "unknown"}]
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], 100)
        self.assertTrue(any(e["id"] == "OD-ESTIMATE-FOLLOWUP" for e in result["ownerDataRequired"]))
        self.assertFalse(any(e["id"] == "OD-ESTIMATE-FOLLOWUP" for e in result["findings"]))

    def test_no_immediate_response_is_strong_signal(self):
        audit = v2_full_audit(RUBRIC)
        audit["checks"]["RL-RSP-01"]["score"] = 1
        audit["checks"]["RL-RSP-01"]["confidence"] = "strong_signal"
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], 98)
        self.assertTrue(any(f["id"] == "RL-RSP-01" for f in result["strongSignals"]))

    def test_financing_not_applicable_does_not_change_score(self):
        base = compute(v2_full_audit(RUBRIC), RUBRIC)["display"]
        config = v2_meta(RUBRIC)["configuration"]
        config["optionalChecks"]["financing"] = False
        audit = v2_full_audit(RUBRIC, config)
        result = compute(audit, RUBRIC)
        self.assertEqual(result["display"], base)

    def test_missing_confidence(self):
        audit = copy.deepcopy(ACME)
        del audit["checks"]["RL-UND-01"]["confidence"]
        missing, errors = validate(audit, RUBRIC)
        self.assertTrue(any("RL-UND-01" in e and "confidence" in e for e in errors))

    def test_missing_evidence(self):
        audit = copy.deepcopy(ACME)
        audit["checks"]["RL-UND-01"]["evidence"] = []
        missing, errors = validate(audit, RUBRIC)
        self.assertTrue(any("RL-UND-01" in e and "evidence" in e for e in errors))

    def test_wrong_rubric_version(self):
        audit = copy.deepcopy(ACME)
        audit["meta"]["rubric_version"] = "1.1.3"
        missing, errors = validate(audit, RUBRIC)
        self.assertTrue(any("rubric_version" in e for e in errors))

    def test_owner_data_does_not_affect_score(self):
        audit = copy.deepcopy(ACME)
        base = compute(audit, RUBRIC)["final"]
        audit["ownerData"] = [{"id": "OD-ESTIMATE-FOLLOWUP", "note": "owner says they follow up"}]
        result = compute(audit, RUBRIC)
        self.assertEqual(result["final"], base)
        self.assertTrue(any(e["id"] == "OD-ESTIMATE-FOLLOWUP" for e in result["ownerDataRequired"]))

    def test_top_leak_confidence_validation(self):
        audit = copy.deepcopy(ACME)
        audit["topLeaks"] = [{"title": "Bad", "confidence": "certain"}]
        missing, errors = validate(audit, RUBRIC)
        self.assertTrue(any("topLeaks" in e for e in errors))

    def test_v2_markdown_has_display_score(self):
        result = compute(ACME, RUBRIC)
        md = scorecard_markdown(result)
        self.assertIn("68 / 100", md)
        self.assertIn("## Revenue opportunities to investigate", md)


if __name__ == "__main__":
    unittest.main()
