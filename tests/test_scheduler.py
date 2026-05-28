from __future__ import annotations

import unittest

from deepwork_scheduler.evidence import RULES
from deepwork_scheduler.scheduler import schedule_from_json


def base_payload() -> dict:
    return {
        "user_id": "u1",
        "date": "2026-05-26",
        "timezone": "Asia/Hong_Kong",
        "workday_start": "09:00",
        "workday_end": "17:30",
        "chronotype": "intermediate",
        "preferred_peak_windows": [],
        "bedtime_target": "23:00",
        "wake_time_target": "07:00",
        "sleep_hours_last_night": 7.5,
        "sleep_quality": 4,
        "recent_sleep_pattern": "adequate",
        "nap_preference": "maybe",
        "caffeine_sensitive": "medium",
        "last_caffeine_time": "16:30",
        "environment": {
            "daylight_access": "medium",
            "workspace_noise": "low",
            "speech_noise_present": False,
            "interruption_load": "low",
            "urgent_channel_available": True,
            "screen_exposure_evening": "medium",
        },
        "user_profile": {
            "distractibility": "low",
            "age_band": None,
            "health_flags": [],
            "telepressure_sensitivity": "medium",
        },
        "fixed_commitments": [{"start": "11:00", "end": "11:30", "title": "Planning"}],
        "tasks": [
            {
                "id": "deep1",
                "title": "Architecture memo",
                "task_type": "writing",
                "complexity": "high",
                "priority": "high",
                "estimated_minutes": 120,
                "deadline": "2026-05-26T18:00:00+08:00",
                "challenge_level": "high",
                "skill_confidence": "medium",
                "requires_uninterrupted_time": True,
            },
            {
                "id": "admin1",
                "title": "Inbox review",
                "task_type": "communication",
                "complexity": "low",
                "priority": "medium",
                "estimated_minutes": 30,
                "deadline": "2026-05-26T17:00:00+08:00",
                "challenge_level": "low",
                "skill_confidence": "high",
                "requires_uninterrupted_time": False,
            },
        ],
    }


class SchedulerTests(unittest.TestCase):
    def test_all_rules_r1_to_r13_exist_with_required_fields(self) -> None:
        self.assertEqual([rule.id for rule in RULES], [f"R{i}" for i in range(1, 14)])
        self.assertEqual(RULES[0].name, "Sleep floor rule")
        self.assertEqual(RULES[0].source_ids, ("S1", "S2", "S3"))
        self.assertEqual(RULES[12].name, "Safety language rule")
        self.assertEqual(RULES[12].source_ids, ("S18", "S2"))
        for rule in RULES:
            self.assertTrue(rule.name)
            self.assertTrue(rule.summary)
            self.assertTrue(rule.evidence_strength)
            self.assertTrue(rule.rationale)
            self.assertIsInstance(rule.parameter_ranges, dict)
            self.assertIsInstance(rule.edge_cases, tuple)
            self.assertTrue(rule.source_ids)

    def test_default_transition_long_deep_when_allowed(self) -> None:
        result = schedule_from_json(base_payload())

        self.assertEqual(result["selected_protocol"], "long_deep_block")
        self.assertTrue(all(block["start"].endswith("+08:00") for block in result["blocks"]))

    def test_missing_chronotype_uses_assumption_and_balanced_if_no_long_task(self) -> None:
        payload = base_payload()
        payload["chronotype"] = "unknown"
        payload["tasks"][0]["requires_uninterrupted_time"] = False
        payload["tasks"][0]["complexity"] = "medium"

        result = schedule_from_json(payload)

        self.assertEqual(result["selected_protocol"], "balanced_block")
        self.assertTrue(any("chronotype is unknown" in item for item in result["assumptions"]))

    def test_sleep_deprived_user_uses_short_cadence_and_reduces_intensity(self) -> None:
        payload = base_payload()
        payload["sleep_hours_last_night"] = 6.0

        result = schedule_from_json(payload)

        self.assertEqual(result["selected_protocol"], "short_cadence")
        self.assertTrue(any("R1 floor" in item for item in result["warnings"]))

    def test_high_distractibility_forbids_long_deep_block(self) -> None:
        payload = base_payload()
        payload["user_profile"]["distractibility"] = "high"

        result = schedule_from_json(payload)

        self.assertEqual(result["selected_protocol"], "short_cadence")
        self.assertNotEqual(result["selected_protocol"], "long_deep_block")

    def test_evening_chronotype_validates_and_outputs_iso_datetimes(self) -> None:
        payload = base_payload()
        payload["chronotype"] = "evening"
        payload["workday_start"] = "10:00"
        payload["workday_end"] = "18:30"

        result = schedule_from_json(payload)

        self.assertEqual(result["meta"]["timezone"], "Asia/Hong_Kong")
        self.assertTrue(result["blocks"][0]["start"].startswith("2026-05-26T"))

    def test_ten_hour_day_uses_split_day_restorative_and_caps_hard_blocks(self) -> None:
        payload = base_payload()
        payload["workday_end"] = "19:00"

        result = schedule_from_json(payload)
        deep_blocks = [block for block in result["blocks"] if block["kind"] == "deep_work"]

        self.assertEqual(result["selected_protocol"], "split_day_restorative")
        self.assertLessEqual(len(deep_blocks), 2)

    def test_high_interruption_forbids_long_deep_block(self) -> None:
        payload = base_payload()
        payload["environment"]["interruption_load"] = "high"

        result = schedule_from_json(payload)

        self.assertEqual(result["selected_protocol"], "balanced_block")

    def test_restricted_sleep_forbids_long_deep_block(self) -> None:
        payload = base_payload()
        payload["recent_sleep_pattern"] = "restricted"

        result = schedule_from_json(payload)

        self.assertEqual(result["selected_protocol"], "short_cadence")

    def test_extended_blocks_never_assigned_when_r1_conservative_mode_active(self) -> None:
        payload = base_payload()
        payload["allow_extended_blocks"] = True

        result = schedule_from_json(payload)
        durations = [
            (block["end"], block["start"])
            for block in result["blocks"]
            if block["kind"] == "deep_work"
        ]

        self.assertNotEqual(result["selected_protocol"], "extended_block")
        for end, start in durations:
            self.assertFalse("extended_block" in result["selected_protocol"])

    def test_caffeine_warning_uses_r7_sources(self) -> None:
        payload = base_payload()
        payload["last_caffeine_time"] = "16:30"

        result = schedule_from_json(payload)

        self.assertTrue(any("[R7]" in warning for warning in result["warnings"]))

    def test_nap_uses_r6_when_fatigue_high_and_sleep_risk_low(self) -> None:
        payload = base_payload()
        payload["sleep_hours_last_night"] = 6.4
        payload["nap_preference"] = "yes"

        result = schedule_from_json(payload)
        nap_blocks = [block for block in result["blocks"] if block["kind"] == "nap"]

        self.assertTrue(nap_blocks)
        self.assertEqual(nap_blocks[0]["applied_rule_ids"], ["R6"])

    def test_clinical_flag_is_non_diagnostic(self) -> None:
        payload = base_payload()
        payload["user_profile"]["health_flags"] = ["persistent_insomnia"]

        result = schedule_from_json(payload)

        self.assertTrue(result["clinical_flag"])
        self.assertIn("not a diagnosis", result["clinical_flag_reason"])


if __name__ == "__main__":
    unittest.main()
