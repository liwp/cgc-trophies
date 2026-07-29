#!/usr/bin/env python3
"""Generate src/lib/turnpoints.ts from a BGA turnpoints .cup file.

Retired codes (present in the current src/lib/turnpoints.ts but absent from
the new .cup file) are preserved rather than deleted, stamped with
``removed: <removed-season>``. Codes that already carry ``added``/``removed``
metadata keep it unchanged.

Usage:
    python3 scripts/update-turnpoints.py "resources/BGA TPs 2026-03-11.cup" --removed-season 2026
"""

import argparse
import csv
import re
import sys
from pathlib import Path

DEFAULT_OUT_PATH = (
    Path(__file__).resolve().parent.parent / "src" / "lib" / "turnpoints.ts"
)

ENTRY_RE = re.compile(
    r'^\s*([A-Za-z0-9_]+):\s*\{\s*name:\s*"((?:[^"\\]|\\.)*)"'
    r'(?:,\s*added:\s*(\d+))?'
    r'(?:,\s*removed:\s*(\d+))?'
    r"\s*\},\s*$"
)


def unescape(s: str) -> str:
    return s.replace('\\"', '"').replace("\\\\", "\\")


def escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def parse_existing(path: Path) -> dict[str, dict]:
    """Parse the existing turnpoints.ts into {code: {name, added?, removed?}}."""
    if not path.exists():
        return {}

    existing: dict[str, dict] = {}
    for line in path.read_text().splitlines():
        m = ENTRY_RE.match(line)
        if not m:
            continue
        code, name, added, removed = m.groups()
        entry: dict[str, str | int] = {"name": unescape(name)}
        if added is not None:
            entry["added"] = int(added)
        if removed is not None:
            entry["removed"] = int(removed)
        existing[code] = entry
    return existing


def read_cup(path: Path) -> dict[str, str]:
    """Parse a .cup file into {code: name}."""
    with open(path) as f:
        reader = csv.DictReader(f)
        return {
            row["code"].strip(): row["name"].strip()
            for row in reader
            if row["code"].strip() and row["name"].strip()
        }


def build_entries(
    cup_points: dict[str, str],
    existing: dict[str, dict],
    removed_season: int | None,
) -> dict[str, dict]:
    merged: dict[str, dict] = {}

    for code, name in cup_points.items():
        entry = {"name": name}
        prior = existing.get(code)
        if prior and "added" in prior:
            entry["added"] = prior["added"]
        merged[code] = entry

    retired_codes = [code for code in existing if code not in cup_points]
    if retired_codes and removed_season is None:
        codes_list = ", ".join(sorted(retired_codes))
        print(
            "error: the new .cup file is missing codes present in the existing "
            f"turnpoints.ts ({codes_list}). Pass --removed-season <year> to stamp "
            "them as retired instead of silently deleting them.",
            file=sys.stderr,
        )
        sys.exit(1)

    for code in retired_codes:
        prior = existing[code]
        entry = {"name": prior["name"]}
        if "added" in prior:
            entry["added"] = prior["added"]
        # Preserve an existing removed stamp unchanged; only stamp fresh retirees.
        entry["removed"] = prior.get("removed", removed_season)
        merged[code] = entry

    return merged


def render(entries: dict[str, dict]) -> str:
    lines = [
        "const TURNPOINTS: Record<",
        "  string,",
        "  { name: string; added?: number; removed?: number }",
        "> = {",
    ]
    for code in sorted(entries):
        entry = entries[code]
        parts = [f'name: "{escape(entry["name"])}"']
        if "added" in entry:
            parts.append(f"added: {entry['added']}")
        if "removed" in entry:
            parts.append(f"removed: {entry['removed']}")
        lines.append(f"  {code}: {{ {', '.join(parts)} }},")
    lines.append("};")
    lines.append("")
    lines.append("export default TURNPOINTS;")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate src/lib/turnpoints.ts from a BGA turnpoints .cup file."
    )
    parser.add_argument("cup_path", type=Path, help="Path to the .cup file")
    parser.add_argument(
        "--removed-season",
        type=int,
        default=None,
        help="Season to stamp on any code retired in this update (required if "
        "any codes are missing from the new .cup file)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT_PATH,
        help="Output path (defaults to src/lib/turnpoints.ts)",
    )
    args = parser.parse_args()

    existing = parse_existing(args.out)
    cup_points = read_cup(args.cup_path)
    entries = build_entries(cup_points, existing, args.removed_season)

    args.out.write_text(render(entries))
    print(f"Wrote {len(entries)} turnpoints to {args.out}")


if __name__ == "__main__":
    main()
