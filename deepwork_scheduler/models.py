"""Typed data models for the deep-work scheduler."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

Chronotype = Literal["morning", "evening", "intermediate", "unknown"]
Level = Literal["low", "medium", "high"]
SleepPattern = Literal["adequate", "irregular", "restricted"]
NapPreference = Literal["yes", "no", "maybe"]
SleepQuality = Literal[1, 2, 3, 4, 5]
TaskType = Literal["analysis", "writing", "coding", "design", "review", "admin", "meeting_prep", "communication"]
Protocol = Literal["short_cadence", "balanced_block", "long_deep_block", "split_day_restorative", "extended_block"]
BlockKind = Literal["deep_work", "medium_work", "break", "nap", "lunch", "meeting", "shutdown"]
Risk = Literal["low", "medium", "high"]


class ValidationError(ValueError):
    """Raised when input JSON fails schema or safety validation."""


@dataclass(frozen=True)
class Rule:
    """Evidence rule used by the deterministic scheduler."""

    id: str
    name: str
    summary: str
    evidence_strength: str
    rationale: str
    parameter_ranges: dict[str, Any]
    edge_cases: tuple[str, ...]
    source_ids: tuple[str, ...]


@dataclass(frozen=True)
class Reference:
    """Source reference for rule provenance."""

    id: str
    title: str
    note: str


@dataclass(frozen=True)
class Environment:
    """Environmental scheduling inputs."""

    daylight_access: Level
    workspace_noise: Level
    speech_noise_present: bool
    interruption_load: Level
    urgent_channel_available: bool
    screen_exposure_evening: Level


@dataclass(frozen=True)
class UserProfile:
    """User profile inputs used for non-medical safety constraints."""

    distractibility: Level
    age_band: str | None
    health_flags: tuple[str, ...]
    telepressure_sensitivity: Level = "medium"


@dataclass(frozen=True)
class FixedCommitment:
    """Timezone-aware fixed commitment."""

    start: datetime
    end: datetime
    title: str


@dataclass(frozen=True)
class Task:
    """Task candidate for scheduling."""

    id: str
    title: str
    task_type: TaskType
    complexity: Level
    priority: Level
    estimated_minutes: int
    deadline: datetime
    challenge_level: Level
    skill_confidence: Level
    requires_uninterrupted_time: bool


@dataclass(frozen=True)
class SchedulerInput:
    """Validated JSON-first scheduler input."""

    user_id: str | None
    date: str
    timezone: str
    workday_start: datetime
    workday_end: datetime
    chronotype: Chronotype
    preferred_peak_windows: tuple[tuple[datetime, datetime], ...]
    bedtime_target: datetime
    wake_time_target: datetime
    sleep_hours_last_night: float
    sleep_quality: SleepQuality
    recent_sleep_pattern: SleepPattern
    nap_preference: NapPreference
    caffeine_sensitive: Level
    last_caffeine_time: datetime | None
    environment: Environment
    user_profile: UserProfile
    fixed_commitments: tuple[FixedCommitment, ...]
    tasks: tuple[Task, ...]
    allow_extended_blocks: bool = False
    allow_sleep_floor_long_block_override: bool = False
    nap_goal: str | None = None
    accepts_sleep_inertia_risk: bool = False


@dataclass(frozen=True)
class Block:
    """Scheduled output block."""

    start: datetime
    end: datetime
    kind: BlockKind
    task_ids: tuple[str, ...]
    rationale: str
    applied_rule_ids: tuple[str, ...]
    applied_source_ids: tuple[str, ...]


@dataclass(frozen=True)
class ScheduleOutput:
    """Complete scheduler output before JSON serialization."""

    meta: dict[str, Any]
    assumptions: tuple[str, ...]
    warnings: tuple[str, ...]
    clinical_flag: bool
    clinical_flag_reason: str | None
    schedule_strain_risk: Risk
    selected_protocol: Protocol
    blocks: tuple[Block, ...]
    human_markdown: str = ""
    mermaid_timeline: str = ""
    references: tuple[Reference, ...] = field(default_factory=tuple)
