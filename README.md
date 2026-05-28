# Deep Work Scheduler

`deepwork_scheduler` is a deterministic Python 3.12 scheduling engine for 8- to 10-hour workdays. It implements the supplied R1-R13 rule catalog and S1-S20 citation catalog for the report **Best Rest and Flow-State Rhythms for Deep Work Without Burnout**.

The package is JSON-first, uses timezone-aware ISO 8601 datetimes, makes no network calls, keeps no hidden state, and uses only the Python standard library at runtime.

## Files

```text
deepwork_scheduler/
  models.py
  evidence.py
  scheduler.py
  render_markdown.py
  render_mermaid.py
  safety.py
  cli.py
tests/test_scheduler.py
examples/basic_day.json
```

## Run

```bash
python3 -m deepwork_scheduler.cli examples/basic_day.json
python3 -m deepwork_scheduler.cli examples/basic_day.json --markdown
python3 -m deepwork_scheduler.cli examples/basic_day.json --mermaid
python3 -m unittest discover -s tests -v
```

## Output Contract

The scheduler returns:

- `meta`
- `assumptions`
- `warnings`
- `clinical_flag`
- `clinical_flag_reason`
- `schedule_strain_risk`
- `selected_protocol`
- `blocks`
- `human_markdown`
- `mermaid_timeline`
- `references`

Each block includes ISO 8601 `start` and `end`, `kind`, `task_ids`, `rationale`, `applied_rule_ids`, and `applied_source_ids`.

## Safety

This tool does not diagnose burnout, insomnia, ADHD, sleep apnea, depression, or any other condition. Clinical flags are non-diagnostic and only advise professional evaluation when input flags or severe dysfunction signals are supplied.

The engine never promises flow. It describes some conditions as flow-conducive.

## Protocols

- `balanced_block`: default, 45-60 minutes focus plus 10 minutes break. Medium-high distractibility or interruptions use the conservative end of the range.
- `short_cadence`: 15-25 minutes focus plus 3-5 minutes break for fatigue-heavy, distractible, or interruption-heavy days.
- `long_deep_block`: 75-90 minutes focus plus 15-20 minutes break for top-priority hard work under favorable conditions.
- `split_day_restorative`: used for workdays over 9 hours or irregular sleep; very hard blocks are capped at 2.
- `extended_block`: represented in the model, but never selected while conservative mode is active.

Long deep blocks are not used when sleep is below 7 hours, interruption load is high, distractibility is high, or recent sleep pattern is restricted unless the caller explicitly sets `allow_sleep_floor_long_block_override`; that override emits a warning and still keeps safety language non-diagnostic.

## Evidence Bundle

The rule catalog is defined in `deepwork_scheduler/evidence.py`. Rules carry exactly the supplied fields: `id`, `name`, `summary`, `evidence_strength`, `rationale`, `parameter_ranges`, `edge_cases`, and `source_ids`.

The scheduler does not add external citations, does not fetch anything from the network, and does not claim to diagnose or treat clinical conditions.
