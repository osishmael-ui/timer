from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .models import ValidationError
from .scheduler import schedule_from_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a deterministic deep-work schedule from JSON.")
    parser.add_argument("input", type=Path, help="Path to scheduler input JSON.")
    parser.add_argument("--markdown", action="store_true", help="Print markdown instead of JSON.")
    parser.add_argument("--mermaid", action="store_true", help="Print Mermaid timeline instead of JSON.")
    args = parser.parse_args()
    try:
        result = schedule_from_json(json.loads(args.input.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError, ValidationError, ValueError) as exc:
        print(f"deepwork-scheduler: {exc}", file=sys.stderr)
        return 2
    if args.markdown:
        print(result["human_markdown"])
    elif args.mermaid:
        print(result["mermaid_timeline"])
    else:
        print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
