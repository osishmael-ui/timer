"""Deterministic timezone-aware deep-work scheduling engine."""

from __future__ import annotations

from dataclasses import replace
from datetime import date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .evidence import REFERENCES, RULES, source_ids_for
from .models import (
    Block,
    Environment,
    FixedCommitment,
    Protocol,
    Risk,
    ScheduleOutput,
    SchedulerInput,
    Task,
    UserProfile,
    ValidationError,
)
from .render_markdown import render_markdown
from .render_mermaid import render_mermaid
from .safety import evaluate_clinical_flag, fatigue_is_high, nighttime_sleep_risk_low

LEVEL_SCORE = {"low": 0, "medium": 1, "high": 2}
PRIORITY_SCORE = {"low": 0, "medium": 10, "high": 20}
COMPLEXITY_SCORE = {"low": 0, "medium": 3, "high": 6}
DEEP_TYPES = {"analysis", "writing", "coding", "design"}
R1_CONSERVATIVE_MODE = True


def schedule_from_json(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate JSON input and return the required JSON output object."""

    data, assumptions, warnings = parse_input(payload)
    output = build_schedule(data, assumptions, warnings)
    output = replace(output, human_markdown=render_markdown(output), mermaid_timeline=render_mermaid(output))
    return to_json(output)


def parse_input(payload: dict[str, Any]) -> tuple[SchedulerInput, list[str], list[str]]:
    """Parse and validate raw JSON into typed scheduler input."""

    if not isinstance(payload, dict):
        raise ValidationError("input must be a JSON object")
    assumptions: list[str] = []
    warnings: list[str] = []
    tz = _timezone(_required_str(payload, "timezone"))
    iso_date = _required_str(payload, "date")
    try:
        schedule_date = date.fromisoformat(iso_date)
    except ValueError as exc:
        raise ValidationError("date must be an ISO date") from exc

    chronotype = payload.get("chronotype", "unknown")
    if chronotype == "unknown":
        assumptions.append("chronotype is unknown; used intermediate peak-window heuristic.")

    env_raw = _required_dict(payload, "environment")
    profile_raw = _required_dict(payload, "user_profile")
    data = SchedulerInput(
        user_id=_optional_str(payload.get("user_id")),
        date=iso_date,
        timezone=str(tz.key),
        workday_start=_parse_datetime(payload["workday_start"], schedule_date, tz, "workday_start"),
        workday_end=_parse_datetime(payload["workday_end"], schedule_date, tz, "workday_end"),
        chronotype=_choice(chronotype, {"morning", "evening", "intermediate", "unknown"}, "chronotype"),
        preferred_peak_windows=_parse_windows(payload.get("preferred_peak_windows", []), schedule_date, tz),
        bedtime_target=_parse_datetime(payload["bedtime_target"], schedule_date, tz, "bedtime_target"),
        wake_time_target=_parse_datetime(payload["wake_time_target"], schedule_date, tz, "wake_time_target"),
        sleep_hours_last_night=float(payload["sleep_hours_last_night"]),
        sleep_quality=_choice(payload["sleep_quality"], {1, 2, 3, 4, 5}, "sleep_quality"),
        recent_sleep_pattern=_choice(payload["recent_sleep_pattern"], {"adequate", "irregular", "restricted"}, "recent_sleep_pattern"),
        nap_preference=_choice(payload["nap_preference"], {"yes", "no", "maybe"}, "nap_preference"),
        caffeine_sensitive=_choice(payload["caffeine_sensitive"], {"low", "medium", "high"}, "caffeine_sensitive"),
        last_caffeine_time=_parse_optional_datetime(payload.get("last_caffeine_time"), schedule_date, tz, "last_caffeine_time"),
        environment=Environment(
            daylight_access=_choice(env_raw["daylight_access"], {"low", "medium", "high"}, "environment.daylight_access"),
            workspace_noise=_choice(env_raw["workspace_noise"], {"low", "medium", "high"}, "environment.workspace_noise"),
            speech_noise_present=bool(env_raw["speech_noise_present"]),
            interruption_load=_choice(env_raw["interruption_load"], {"low", "medium", "high"}, "environment.interruption_load"),
            urgent_channel_available=bool(env_raw["urgent_channel_available"]),
            screen_exposure_evening=_choice(env_raw["screen_exposure_evening"], {"low", "medium", "high"}, "environment.screen_exposure_evening"),
        ),
        user_profile=UserProfile(
            distractibility=_choice(profile_raw["distractibility"], {"low", "medium", "high"}, "user_profile.distractibility"),
            age_band=_optional_str(profile_raw.get("age_band")),
            health_flags=tuple(str(flag) for flag in profile_raw.get("health_flags", [])),
            telepressure_sensitivity=_choice(profile_raw.get("telepressure_sensitivity", "medium"), {"low", "medium", "high"}, "user_profile.telepressure_sensitivity"),
        ),
        fixed_commitments=_parse_commitments(payload.get("fixed_commitments", []), schedule_date, tz),
        tasks=_parse_tasks(payload.get("tasks", []), schedule_date, tz),
        allow_extended_blocks=bool(payload.get("allow_extended_blocks", False)),
        allow_sleep_floor_long_block_override=bool(payload.get("allow_sleep_floor_long_block_override", False)),
        nap_goal=_optional_str(payload.get("nap_goal")),
        accepts_sleep_inertia_risk=bool(payload.get("accepts_sleep_inertia_risk", False)),
    )
    if data.workday_end <= data.workday_start:
        raise ValidationError("workday_end must be after workday_start")
    hours = _minutes(data.workday_start, data.workday_end) / 60
    if hours < 8 or hours > 10:
        warnings.append("Workday is outside the requested 8- to 10-hour design range; constraints are still applied conservatively.")
    return data, assumptions, warnings


def build_schedule(data: SchedulerInput, assumptions: list[str] | None = None, warnings: list[str] | None = None) -> ScheduleOutput:
    """Build a deterministic schedule from validated input."""

    assumptions = list(assumptions or [])
    warnings = list(warnings or [])
    selected_protocol = select_protocol(data)
    focus_minutes, break_minutes = _protocol_minutes(selected_protocol)
    workday_minutes = _minutes(data.workday_start, data.workday_end)
    long_day = workday_minutes > 9 * 60
    if long_day:
        warnings.append("Workday exceeds 9 hours; capped very hard blocks at 2 and shifted later work toward medium depth.")
    if _sleep_floor_active(data):
        warnings.append("Sleep input is below the R1 floor or restricted; intensity was reduced in neutral, non-medical terms. [R1]")
    if data.allow_sleep_floor_long_block_override and _sleep_floor_active(data):
        warnings.append("Sleep-floor long-block override was requested; this is allowed only as an explicit override and remains higher strain. [R1]")
    _add_environment_warnings(data, warnings)
    _add_caffeine_warning(data, warnings)

    commitments = sorted(data.fixed_commitments, key=lambda item: (item.start, item.title))
    blocks: list[Block] = [
        _block(c.start, c.end, "meeting", (), f"Fixed commitment protected before discretionary work by the scheduling hierarchy.", ("R13",))
        for c in commitments
    ]
    free = _subtract_intervals([(data.workday_start, data.workday_end)], [(c.start, c.end) for c in commitments])
    lunch = _place_lunch(free, data)
    if lunch:
        blocks.append(_block(lunch[0], lunch[1], "lunch", (), "Recovery meal break for sustainable workday pacing.", ("R12",)))
        free = _subtract_intervals(free, [lunch])
    nap = _place_nap(free, data)
    if nap:
        rule_text = "Short nap recommended because fatigue is high and nighttime sleep risk is low."
        if _minutes(nap[0], nap[1]) == 30:
            rule_text += " Heuristic memory-support nap; sleep inertia risk was explicitly accepted."
        blocks.append(_block(nap[0], nap[1], "nap", (), rule_text, ("R6",)))
        free = _subtract_intervals(free, [nap])

    ordered_tasks = sorted(data.tasks, key=_task_sort_key)
    hard_blocks = 0
    remaining: dict[str, int] = {task.id: task.estimated_minutes for task in ordered_tasks}
    cursor_windows = list(free)
    for task in ordered_tasks:
        while remaining[task.id] > 0:
            window_index = _first_window_with_room(cursor_windows, min(remaining[task.id], focus_minutes))
            if window_index is None:
                warnings.append(f"Could not fully schedule {task.id}; {remaining[task.id]} minute(s) remain.")
                break
            start, end = cursor_windows[window_index]
            hard_candidate = _is_deep_task(task) and selected_protocol != "short_cadence"
            hard_allowed = not (long_day and hard_blocks >= 2)
            kind = "deep_work" if hard_candidate and hard_allowed else "medium_work"
            duration = min(remaining[task.id], focus_minutes, _minutes(start, end))
            if selected_protocol == "extended_block":
                duration = min(remaining[task.id], 90, _minutes(start, end))
            block_end = start + timedelta(minutes=duration)
            rule_ids = _task_rule_ids(data, task, kind, selected_protocol)
            rationale = _task_rationale(data, task, kind, selected_protocol)
            blocks.append(_block(start, block_end, kind, (task.id,), rationale, rule_ids))
            remaining[task.id] -= duration
            if kind == "deep_work":
                hard_blocks += 1
            replacement: list[tuple[datetime, datetime]] = []
            if block_end < end:
                break_end = min(end, block_end + timedelta(minutes=break_minutes))
                break_rule = {"short_cadence": "R3", "balanced_block": "R2", "long_deep_block": "R4", "split_day_restorative": "R11", "extended_block": "R4"}[selected_protocol]
                blocks.append(_block(block_end, break_end, "break", (), "Recovery break placed after focus work.", (break_rule, "R12")))
                if break_end < end:
                    replacement.append((break_end, end))
            cursor_windows.pop(window_index)
            cursor_windows[window_index:window_index] = replacement

    shutdown = _place_shutdown(cursor_windows, data)
    if shutdown:
        blocks.append(_block(shutdown[0], shutdown[1], "shutdown", (), "Shutdown buffer supports evening detachment; heuristic schedule hygiene.", ("R12", "R13")))

    blocks = tuple(sorted(blocks, key=lambda block: (block.start, block.end, block.kind, block.task_ids)))
    clinical_flag, clinical_reason = evaluate_clinical_flag(data)
    risk = _schedule_risk(data, blocks, selected_protocol)
    meta = {
        "user_id": data.user_id,
        "date": data.date,
        "timezone": data.timezone,
        "engine": "deepwork_scheduler",
        "rule_ids": [rule.id for rule in RULES],
    }
    return ScheduleOutput(
        meta=meta,
        assumptions=tuple(assumptions),
        warnings=tuple(dict.fromkeys(warnings)),
        clinical_flag=clinical_flag,
        clinical_flag_reason=clinical_reason,
        schedule_strain_risk=risk,
        selected_protocol=selected_protocol,
        blocks=blocks,
        references=REFERENCES,
    )


def select_protocol(data: SchedulerInput) -> Protocol:
    """Select a protocol according to the hard scheduling hierarchy."""

    if _long_deep_forbidden(data):
        return "short_cadence" if fatigue_is_high(data) or data.user_profile.distractibility == "high" else "balanced_block"
    if _minutes(data.workday_start, data.workday_end) > 9 * 60 or data.recent_sleep_pattern == "irregular":
        return "split_day_restorative"
    top = sorted(data.tasks, key=_task_sort_key)[0] if data.tasks else None
    if data.allow_extended_blocks and top and top.priority == "high" and not R1_CONSERVATIVE_MODE:
        return "extended_block"
    if top and top.priority == "high" and top.complexity == "high" and top.requires_uninterrupted_time:
        return "long_deep_block"
    return "balanced_block"


def to_json(output: ScheduleOutput) -> dict[str, Any]:
    """Serialize scheduler output to the required JSON object."""

    return {
        "meta": output.meta,
        "assumptions": list(output.assumptions),
        "warnings": list(output.warnings),
        "clinical_flag": output.clinical_flag,
        "clinical_flag_reason": output.clinical_flag_reason,
        "schedule_strain_risk": output.schedule_strain_risk,
        "selected_protocol": output.selected_protocol,
        "blocks": [
            {
                "start": block.start.isoformat(),
                "end": block.end.isoformat(),
                "kind": block.kind,
                "task_ids": list(block.task_ids),
                "rationale": block.rationale,
                "applied_rule_ids": list(block.applied_rule_ids),
                "applied_source_ids": list(block.applied_source_ids),
            }
            for block in output.blocks
        ],
        "human_markdown": output.human_markdown,
        "mermaid_timeline": output.mermaid_timeline,
        "references": [{"id": ref.id, "title": ref.title, "note": ref.note} for ref in output.references],
    }


def _long_deep_forbidden(data: SchedulerInput) -> bool:
    return (
        (_sleep_floor_active(data) and not data.allow_sleep_floor_long_block_override)
        or data.environment.interruption_load == "high"
        or data.user_profile.distractibility == "high"
    )


def _sleep_floor_active(data: SchedulerInput) -> bool:
    return data.sleep_hours_last_night < 7 or data.recent_sleep_pattern == "restricted"


def _protocol_minutes(protocol: Protocol) -> tuple[int, int]:
    if protocol == "short_cadence":
        return 25, 5
    if protocol == "long_deep_block":
        return 90, 20
    if protocol == "split_day_restorative":
        return 50, 10
    if protocol == "extended_block":
        return 90, 20
    return 50, 10


def _task_sort_key(task: Task) -> tuple[int, datetime, str]:
    value = PRIORITY_SCORE[task.priority] + COMPLEXITY_SCORE[task.complexity] + LEVEL_SCORE[task.challenge_level] - LEVEL_SCORE[task.skill_confidence]
    return (-value, task.deadline, task.id)


def _is_deep_task(task: Task) -> bool:
    return task.task_type in DEEP_TYPES and task.complexity in {"medium", "high"} and task.priority in {"medium", "high"}


def _task_rule_ids(data: SchedulerInput, task: Task, kind: str, protocol: Protocol) -> tuple[str, ...]:
    ids = ["R13"]
    if _sleep_floor_active(data):
        ids.append("R1")
    ids.append("R5")
    ids.append("R10")
    if task.requires_uninterrupted_time or kind == "deep_work":
        ids.append("R8")
    ids.append({"short_cadence": "R3", "balanced_block": "R2", "long_deep_block": "R4", "split_day_restorative": "R11", "extended_block": "R4"}[protocol])
    if data.environment.speech_noise_present or data.environment.daylight_access == "low":
        ids.append("R9")
    return tuple(dict.fromkeys(ids))


def _task_rationale(data: SchedulerInput, task: Task, kind: str, protocol: Protocol) -> str:
    pieces = ["Placed by priority, complexity, deadline, and chronotype-aware ordering; this is flow-conducive, not a flow guarantee."]
    if kind == "medium_work":
        pieces.append("Intensity reduced because recovery or long-day constraints limit very hard blocks.")
    if data.environment.urgent_channel_available:
        pieces.append("Mute nonessential notifications while preserving the urgent channel.")
    if data.user_profile.telepressure_sensitivity == "high":
        pieces.append("Use batch checks each break instead of a full communication blackout.")
    if data.environment.speech_noise_present:
        pieces.append("Prefer headphones or a quiet room due to speech noise.")
    if LEVEL_SCORE[task.challenge_level] - LEVEL_SCORE[task.skill_confidence] >= 2:
        pieces.append("Challenge exceeds confidence; treat this as a starter block with a clear next action.")
    if protocol == "extended_block":
        pieces.append("Extended-block recommendation has weaker evidentiary basis.")
    return " ".join(pieces)


def _schedule_risk(data: SchedulerInput, blocks: tuple[Block, ...], protocol: Protocol) -> Risk:
    deep_minutes = sum(_minutes(block.start, block.end) for block in blocks if block.kind == "deep_work")
    strain = deep_minutes
    if data.sleep_hours_last_night < 7:
        strain += 60
    if data.recent_sleep_pattern != "adequate":
        strain += 45
    if protocol in {"long_deep_block", "split_day_restorative"}:
        strain += 30
    if strain <= 150:
        return "low"
    if strain <= 260:
        return "medium"
    return "high"


def _add_environment_warnings(data: SchedulerInput, warnings: list[str]) -> None:
    if data.environment.daylight_access == "low":
        warnings.append("Daylight access is low; add a morning or daytime light exposure suggestion. [R9]")
    if data.environment.speech_noise_present:
        warnings.append("Speech noise is present; prefer headphones or a quiet room during deep blocks. [R9]")
    if data.environment.screen_exposure_evening == "high":
        warnings.append("Evening screen exposure is high; reduce bright artificial light before bedtime where feasible. [R9]")


def _add_caffeine_warning(data: SchedulerInput, warnings: list[str]) -> None:
    cutoff = data.bedtime_target - timedelta(hours=8)
    if data.caffeine_sensitive == "high":
        cutoff -= timedelta(hours=2)
    if data.last_caffeine_time and data.last_caffeine_time > cutoff:
        warnings.append(f"Last caffeine time is after the conservative cutoff {cutoff.isoformat()}. [R7]")


def _place_lunch(free: list[tuple[datetime, datetime]], data: SchedulerInput) -> tuple[datetime, datetime] | None:
    target = _at(data, time(12, 0))
    for start, end in free:
        lunch_start = max(start, target)
        lunch_end = lunch_start + timedelta(minutes=30)
        if lunch_end <= end:
            return lunch_start, lunch_end
    return None


def _place_nap(free: list[tuple[datetime, datetime]], data: SchedulerInput) -> tuple[datetime, datetime] | None:
    if data.nap_preference == "no" or not fatigue_is_high(data) or not nighttime_sleep_risk_low(data):
        return None
    nap_minutes = 30 if data.nap_goal == "memory_support" and data.accepts_sleep_inertia_risk else 20
    nap_window = (_at(data, time(13, 0)), _at(data, time(15, 0)))
    for start, end in _intersections(free, [nap_window]):
        nap_end = start + timedelta(minutes=nap_minutes)
        if nap_end <= end:
            return start, nap_end
    return None


def _place_shutdown(free: list[tuple[datetime, datetime]], data: SchedulerInput) -> tuple[datetime, datetime] | None:
    latest = data.workday_end
    for start, end in sorted(free, reverse=True):
        shutdown_start = max(start, min(end, latest) - timedelta(minutes=15))
        shutdown_end = shutdown_start + timedelta(minutes=15)
        if shutdown_end <= end:
            return shutdown_start, shutdown_end
    return None


def _first_window_with_room(windows: list[tuple[datetime, datetime]], desired: int) -> int | None:
    minimum = min(15, desired)
    for index, (start, end) in enumerate(windows):
        if _minutes(start, end) >= minimum:
            return index
    return None


def _subtract_intervals(base: list[tuple[datetime, datetime]], busy: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
    free = list(base)
    for busy_start, busy_end in sorted(busy):
        next_free: list[tuple[datetime, datetime]] = []
        for start, end in free:
            if busy_end <= start or busy_start >= end:
                next_free.append((start, end))
                continue
            if start < busy_start:
                next_free.append((start, busy_start))
            if busy_end < end:
                next_free.append((busy_end, end))
        free = next_free
    return [(start, end) for start, end in free if start < end]


def _intersections(a: list[tuple[datetime, datetime]], b: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
    result: list[tuple[datetime, datetime]] = []
    for a_start, a_end in a:
        for b_start, b_end in b:
            start = max(a_start, b_start)
            end = min(a_end, b_end)
            if start < end:
                result.append((start, end))
    return result


def _block(start: datetime, end: datetime, kind: str, task_ids: tuple[str, ...], rationale: str, rule_ids: tuple[str, ...]) -> Block:
    return Block(start=start, end=end, kind=kind, task_ids=task_ids, rationale=rationale, applied_rule_ids=rule_ids, applied_source_ids=source_ids_for(rule_ids))  # type: ignore[arg-type]


def _parse_tasks(raw_tasks: Any, schedule_date: date, tz: ZoneInfo) -> tuple[Task, ...]:
    if not isinstance(raw_tasks, list):
        raise ValidationError("tasks must be a list")
    tasks: list[Task] = []
    for raw in raw_tasks:
        if not isinstance(raw, dict):
            raise ValidationError("each task must be an object")
        tasks.append(
            Task(
                id=_required_str(raw, "id"),
                title=_required_str(raw, "title"),
                task_type=_choice(raw["task_type"], {"analysis", "writing", "coding", "design", "review", "admin", "meeting_prep", "communication"}, "task_type"),
                complexity=_choice(raw["complexity"], {"low", "medium", "high"}, "complexity"),
                priority=_choice(raw["priority"], {"low", "medium", "high"}, "priority"),
                estimated_minutes=_positive_int(raw["estimated_minutes"], "estimated_minutes"),
                deadline=_parse_datetime(raw["deadline"], schedule_date, tz, "deadline"),
                challenge_level=_choice(raw["challenge_level"], {"low", "medium", "high"}, "challenge_level"),
                skill_confidence=_choice(raw["skill_confidence"], {"low", "medium", "high"}, "skill_confidence"),
                requires_uninterrupted_time=bool(raw["requires_uninterrupted_time"]),
            )
        )
    return tuple(tasks)


def _parse_commitments(raw_items: Any, schedule_date: date, tz: ZoneInfo) -> tuple[FixedCommitment, ...]:
    if not isinstance(raw_items, list):
        raise ValidationError("fixed_commitments must be a list")
    items = tuple(
        FixedCommitment(
            start=_parse_datetime(raw["start"], schedule_date, tz, "fixed_commitments.start"),
            end=_parse_datetime(raw["end"], schedule_date, tz, "fixed_commitments.end"),
            title=_required_str(raw, "title"),
        )
        for raw in raw_items
    )
    for item in items:
        if item.end <= item.start:
            raise ValidationError("fixed commitment end must be after start")
    return items


def _parse_windows(raw_items: Any, schedule_date: date, tz: ZoneInfo) -> tuple[tuple[datetime, datetime], ...]:
    if not isinstance(raw_items, list):
        raise ValidationError("preferred_peak_windows must be a list")
    windows = tuple((_parse_datetime(raw["start"], schedule_date, tz, "peak.start"), _parse_datetime(raw["end"], schedule_date, tz, "peak.end")) for raw in raw_items)
    return tuple((start, end) for start, end in windows if start < end)


def _parse_optional_datetime(value: Any, schedule_date: date, tz: ZoneInfo, field_name: str) -> datetime | None:
    if value is None:
        return None
    return _parse_datetime(value, schedule_date, tz, field_name)


def _parse_datetime(value: Any, schedule_date: date, tz: ZoneInfo, field_name: str) -> datetime:
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be an ISO datetime or HH:MM string")
    if "T" in value:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=tz)
        return parsed.astimezone(tz)
    hour, minute = value.split(":", 1)
    return datetime.combine(schedule_date, time(int(hour), int(minute)), tzinfo=tz)


def _at(data: SchedulerInput, local_time: time) -> datetime:
    return datetime.combine(date.fromisoformat(data.date), local_time, tzinfo=ZoneInfo(data.timezone))


def _minutes(start: datetime, end: datetime) -> int:
    return int((end - start).total_seconds() // 60)


def _timezone(value: str) -> ZoneInfo:
    try:
        return ZoneInfo(value)
    except ZoneInfoNotFoundError as exc:
        raise ValidationError(f"unknown timezone: {value}") from exc


def _required_dict(payload: dict[str, Any], key: str) -> dict[str, Any]:
    value = payload.get(key)
    if not isinstance(value, dict):
        raise ValidationError(f"{key} must be an object")
    return value


def _required_str(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{key} must be a non-empty string")
    return value.strip()


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValidationError("optional string field must be a string")
    return value.strip()


def _choice(value: Any, allowed: set[Any], field_name: str) -> Any:
    if value not in allowed:
        raise ValidationError(f"{field_name} must be one of {sorted(allowed)}")
    return value


def _positive_int(value: Any, field_name: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise ValidationError(f"{field_name} must be positive")
    return parsed
