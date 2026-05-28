"""Mermaid timeline renderer."""

from __future__ import annotations

from .models import ScheduleOutput


def render_mermaid(output: ScheduleOutput) -> str:
    """Render Mermaid timeline text from scheduled blocks."""

    lines = ["timeline", f"    title Deep-work schedule {output.meta['date']}"]
    for block in output.blocks:
        label = block.kind.replace("_", " ")
        if block.task_ids:
            label = f"{label} ({', '.join(block.task_ids)})"
        rules = ",".join(block.applied_rule_ids)
        lines.append(f"    {block.start.isoformat()} to {block.end.isoformat()} : {label} [{rules}]")
    return "\n".join(lines)
