"""Evidence bundle and R1-R13 rule catalog supplied by the user."""

from __future__ import annotations

from .models import Reference, Rule

REFERENCES: tuple[Reference, ...] = (
    Reference("S1", "adult sleep consensus 7+ hours", "Supplied citation catalog entry."),
    Reference("S2", "AASM healthy sleep framing and regularity", "Supplied citation catalog entry."),
    Reference("S3", "sleep-loss cognitive effects review", "Supplied citation catalog entry."),
    Reference("S4", "micro-break meta-analysis", "Supplied citation catalog entry."),
    Reference("S5", "micro-break commentary on longer breaks for demanding tasks", "Supplied citation catalog entry."),
    Reference("S6", "ultradian caution, no stable 1.5h law", "Supplied citation catalog entry."),
    Reference("S7", "prolonged work-hours and cognition review", "Supplied citation catalog entry."),
    Reference("S8", "time-of-day and chronotype review", "Supplied citation catalog entry."),
    Reference("S9", "chronotype synchrony review", "Supplied citation catalog entry."),
    Reference("S10", "10-minute nap study", "Supplied citation catalog entry."),
    Reference("S11", "nap review", "Supplied citation catalog entry."),
    Reference("S12", "2023 mid-afternoon nap-duration study", "Supplied citation catalog entry."),
    Reference("S13", "NHLBI nap/caffeine guidance", "Supplied citation catalog entry."),
    Reference("S14", "caffeine-sleep meta-analysis", "Supplied citation catalog entry."),
    Reference("S15", "CDC sleep guidance", "Supplied citation catalog entry."),
    Reference("S16", "notification interruption field experiment", "Supplied citation catalog entry."),
    Reference("S17", "NIGMS circadian/light guidance", "Supplied citation catalog entry."),
    Reference("S18", "WHO burnout framing", "Supplied citation catalog entry."),
    Reference("S19", "flow-at-work review", "Supplied citation catalog entry."),
    Reference("S20", "recovery experiences meta-analysis", "Supplied citation catalog entry."),
)

RULES: tuple[Rule, ...] = (
    Rule(
        id="R1",
        name="Sleep floor rule",
        summary="If regular sleep is under 7 hours or recent sleep is restricted, downgrade intensity and shorten focus blocks.",
        evidence_strength="strong",
        rationale="Recent sleep below the supplied floor or restricted sleep triggers shorter, lower-intensity scheduling.",
        parameter_ranges={"balanced_blocks": "45-50 min", "avoid": "long deep blocks"},
        edge_cases=("If user insists on long blocks, allow only with explicit override and warning.",),
        source_ids=("S1", "S2", "S3"),
    ),
    Rule(
        id="R2",
        name="Balanced default block",
        summary="Default to 45-60 min focus + 10 min break.",
        evidence_strength="moderate",
        rationale="Balanced blocks are used when safety, sleep, and interruption constraints do not call for a shorter cadence.",
        parameter_ranges={"focus_minutes": "45-60", "break_minutes": 10},
        edge_cases=("Use 45 instead of 60 if distractibility or interruptions are medium-high.",),
        source_ids=("S4", "S5"),
    ),
    Rule(
        id="R3",
        name="Short-cadence option",
        summary="Use 15-25 min focus + 3-5 min break for initiation resistance, distractibility, or fatigue-heavy days.",
        evidence_strength="moderate",
        rationale="Shorter cycles are used for fatigue-heavy, distractible, or interruption-heavy days.",
        parameter_ranges={"focus_minutes": "15-25", "break_minutes": "3-5"},
        edge_cases=("Use only for first 1-3 cycles unless user explicitly prefers this all day.",),
        source_ids=("S4", "S5"),
    ),
    Rule(
        id="R4",
        name="Long deep-block option",
        summary="Use 75-90 min focus + 15-20 min break for top-priority hard work under favorable conditions.",
        evidence_strength="moderate",
        rationale="Long blocks are reserved for top-priority hard work when sleep, distraction, and interruption conditions are favorable.",
        parameter_ranges={"focus_minutes": "75-90", "break_minutes": "15-20"},
        edge_cases=("Exact 90-minute biology is uncertain; treat 90 as heuristic, not law.",),
        source_ids=("S4", "S6", "S7"),
    ),
    Rule(
        id="R5",
        name="Chronotype alignment",
        summary="Place hardest work in chronotype-consistent windows.",
        evidence_strength="moderate",
        rationale="Harder work is preferentially placed in chronotype-consistent windows when feasible.",
        parameter_ranges={"high_complexity_blocks": "1-2 in peak window"},
        edge_cases=("If chronotype unknown, remain neutral.",),
        source_ids=("S8", "S9"),
    ),
    Rule(
        id="R6",
        name="Nap rule",
        summary="Default nap is 10-20 min in early afternoon; optional 30 minutes only for memory-support use cases.",
        evidence_strength="moderate",
        rationale="Short early-afternoon naps are recommended only when fatigue is high and nighttime sleep risk is low.",
        parameter_ranges={"nap_minutes": "10-20", "preferred_window": "13:00-15:00"},
        edge_cases=("Avoid or shorten if insomnia risk is high or bedtime is early.",),
        source_ids=("S10", "S11", "S12", "S13"),
    ),
    Rule(
        id="R7",
        name="Caffeine cutoff",
        summary="Avoid caffeine within 8 hours of bedtime; avoid afternoon/evening use by default.",
        evidence_strength="strong",
        rationale="Caffeine warnings use bedtime minus 8 hours, shifted earlier for high sensitivity.",
        parameter_ranges={"cutoff": "bedtime - 8h"},
        edge_cases=("Shift earlier if high sensitivity.",),
        source_ids=("S14", "S13", "S15"),
    ),
    Rule(
        id="R8",
        name="Interruption suppression",
        summary="Reduce notification-caused interruptions during deep blocks.",
        evidence_strength="moderate",
        rationale="Deep blocks preserve an urgent channel and reduce nonessential interruptions.",
        parameter_ranges={"deep_blocks": "urgent channel only"},
        edge_cases=("If telepressure-like preference is high, use batched checks instead of full blackout.",),
        source_ids=("S16",),
    ),
    Rule(
        id="R9",
        name="Bright-day / dim-night environment rule",
        summary="Increase morning or daytime light; reduce bright artificial light before bed; protect sleep environment.",
        evidence_strength="strong",
        rationale="Environment guidance is emitted as recommendations rather than hard schedule constraints.",
        parameter_ranges={"constraint_type": "recommendation only"},
        edge_cases=("If user works nights, respect shifted schedule but still align light with intended wake phase.",),
        source_ids=("S15", "S17", "S18"),
    ),
    Rule(
        id="R10",
        name="Flow-condition rule",
        summary="Optimize challenge-skill fit, clear next step, and uninterrupted runway; do not guarantee flow.",
        evidence_strength="moderate",
        rationale="Deep-work rationales specify flow-conducive conditions without promising flow.",
        parameter_ranges={"deep_block_setup": "specify next action"},
        edge_cases=("If challenge greatly exceeds skill_confidence, split task into starter blocks.",),
        source_ids=("S19",),
    ),
    Rule(
        id="R11",
        name="Long-day cap",
        summary="For >9h workdays, limit very hard blocks to 2 and shift remaining work to medium-depth tasks.",
        evidence_strength="moderate",
        rationale="Long days cap very hard blocks and shift remaining tasks toward medium-depth work.",
        parameter_ranges={"max_heavy_blocks_per_day": 2},
        edge_cases=("If fixed deadlines force more, downgrade to short-cadence and warn.",),
        source_ids=("S7",),
    ),
    Rule(
        id="R12",
        name="Recovery output rule",
        summary="Add shutdown, evening detachment, and weekend regularity guidance.",
        evidence_strength="moderate",
        rationale="Shutdown and recovery guidance supports detachment after the workday.",
        parameter_ranges={"shutdown_minutes": "10-20"},
        edge_cases=("Include only in output metadata if user asks for workday-only schedule.",),
        source_ids=("S20", "S2"),
    ),
    Rule(
        id="R13",
        name="Safety language rule",
        summary="Never diagnose burnout or sleep disorders; use schedule_strain_risk and clinical_flag only.",
        evidence_strength="strong",
        rationale="Safety language remains non-diagnostic and advises professional evaluation only when clinical signals are supplied.",
        parameter_ranges={"diagnosis": "never"},
        edge_cases=("If symptoms seem clinical, advise professional evaluation.",),
        source_ids=("S18", "S2"),
    ),
)

RULES_BY_ID: dict[str, Rule] = {rule.id: rule for rule in RULES}


def source_ids_for(rule_ids: tuple[str, ...]) -> tuple[str, ...]:
    """Return deterministic source IDs for rule IDs."""

    seen: list[str] = []
    for rule_id in rule_ids:
        for source_id in RULES_BY_ID[rule_id].source_ids:
            if source_id not in seen:
                seen.append(source_id)
    return tuple(seen)
