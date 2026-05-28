"""Markdown renderer for scheduler output."""

from __future__ import annotations

from .models import ScheduleOutput


def render_markdown(output: ScheduleOutput) -> str:
    """Render a human-readable schedule with inline rule citations."""

    lines = [
        f"# Deep-work schedule for {output.meta['date']}",
        "",
        f"Selected protocol: **{output.selected_protocol}**",
        f"Schedule strain risk: **{output.schedule_strain_risk}**",
        f"Clinical flag: **{'yes' if output.clinical_flag else 'no'}**",
    ]
    if output.clinical_flag_reason:
        lines.append(output.clinical_flag_reason)
    lines.extend(["", "| Time | Block | Why it exists |", "| --- | --- | --- |"])
    for block in output.blocks:
        rules = ", ".join(block.applied_rule_ids)
        time_range = f"{block.start.isoformat()} to {block.end.isoformat()}"
        task_text = f" ({', '.join(block.task_ids)})" if block.task_ids else ""
        lines.append(f"| {time_range} | {block.kind}{task_text} | {block.rationale} [{rules}] |")
    if output.assumptions:
        lines.extend(["", "## Assumptions"])
        lines.extend(f"- {item}" for item in output.assumptions)
    if output.warnings:
        lines.extend(["", "## Warnings"])
        lines.extend(f"- {item}" for item in output.warnings)
    lines.extend(
        [
            "",
            "## Notes",
            "- Flow is not promised; deep blocks are described only as flow-conducive conditions.",
            "- Heuristic recommendations are labeled in the block rationale when evidence is weaker or preference-driven.",
        ]
    )
    return "\n".join(lines)
