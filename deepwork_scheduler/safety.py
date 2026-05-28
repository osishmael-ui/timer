"""Non-medical safety helpers for schedule generation."""

from __future__ import annotations

from .models import SchedulerInput

PERSISTENT_SYMPTOM_MARKERS = (
    "persistent_insomnia",
    "severe_daytime_sleepiness",
    "severe_dysfunction",
    "major_mood_concern",
    "breathing_disruption_sleep",
    "professional_evaluation_requested",
)


def evaluate_clinical_flag(data: SchedulerInput) -> tuple[bool, str | None]:
    """Return a non-diagnostic professional-evaluation flag."""

    flags = {flag.strip().lower() for flag in data.user_profile.health_flags if flag.strip()}
    matched = sorted(flags.intersection(PERSISTENT_SYMPTOM_MARKERS))
    severe_inputs = data.sleep_hours_last_night < 4 and data.sleep_quality <= 2
    if matched or severe_inputs:
        reasons = matched or ["very_low_sleep_and_low_quality"]
        return (
            True,
            "Inputs include persistent or severe concern signal(s): "
            f"{', '.join(reasons)}. This is not a diagnosis or treatment advice; consider professional evaluation.",
        )
    return False, None


def fatigue_is_high(data: SchedulerInput) -> bool:
    """Return whether inputs indicate high fatigue for scheduling purposes."""

    return data.sleep_hours_last_night < 6.5 or data.sleep_quality <= 2 or data.recent_sleep_pattern == "restricted"


def nighttime_sleep_risk_low(data: SchedulerInput) -> bool:
    """Return whether a short early nap is unlikely to conflict with the declared bedtime."""

    return data.recent_sleep_pattern != "restricted" and data.sleep_quality >= 3
