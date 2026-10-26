#!/usr/bin/env python3
"""Generate src/lib/turnpoints.ts from a BGA turnpoints .cup file.

The BGA publishes an updated turnpoint file about once a year, adding and
removing codes, while past seasons' flights still use the old ones. So:

- codes new in this file are stamped ``added: <season>``;
- retired codes (in the current turnpoints.ts but missing from the new file)
  are kept with their last known name and stamped ``removed: <season>``;
- existing ``added``/``removed`` stamps are kept unchanged, except that a
  retired code that reappears loses its ``removed`` stamp.

``--season`` is required whenever any code is added or removed.

``--backfill`` adds codes that were retired before turnpoints.ts started
tracking them, from older releases given in date order (file names must
contain the release date, e.g. "BGA TPs 2021-02-11.cup"). Each missing code
gets its name from the last release containing it, ``removed`` from the first
later release without it (or ``--season``, the year of the release
turnpoints.ts was first generated from, if the newest file given still has
it), and ``added`` from the first release containing it unless that is the
oldest file given (when its real start is unknown).
Codes already in turnpoints.ts are left unchanged.

Usage:
    python3 scripts/update-turnpoints.py "BGA TPs 2026-06-10.cup" --season 2026
    python3 scripts/update-turnpoints.py --backfill "BGA TPs 2020-07-20.cup" ... --season 2026
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
    season: int | None,
) -> dict[str, dict]:
    merged: dict[str, dict[str, str | int]] = {}

    new_codes = [code for code in cup_points if code not in existing]
    retired_codes = [code for code in existing if code not in cup_points]
    newly_retired = [code for code in retired_codes if "removed" not in existing[code]]
    # A first run (no existing file) has nothing to compare against.
    if existing and (new_codes or newly_retired) and season is None:
        print(
            "error: this .cup file adds "
            f"{', '.join(sorted(new_codes)) or 'no codes'} and removes "
            f"{', '.join(sorted(newly_retired)) or 'no codes'} compared with "
            "the existing turnpoints.ts. Pass --season <year> to stamp them.",
            file=sys.stderr,
        )
        sys.exit(1)

    for code, name in cup_points.items():
        entry: dict[str, str | int] = {"name": name}
        prior = existing.get(code)
        if prior and "added" in prior:
            entry["added"] = prior["added"]
        elif existing and not prior and season is not None:
            entry["added"] = season
        merged[code] = entry

    for code in retired_codes:
        prior = existing[code]
        entry = {"name": prior["name"]}
        if "added" in prior:
            entry["added"] = prior["added"]
        # Preserve an existing removed stamp unchanged; only stamp fresh retirees.
        entry["removed"] = prior.get("removed", season)
        merged[code] = entry

    return merged


def release_year(path: Path) -> int:
    match = re.search(r"(\d{4})-\d{2}-\d{2}", path.name)
    if not match:
        print(f"error: no release date in file name: {path.name}", file=sys.stderr)
        sys.exit(1)
    return int(match.group(1))


def backfill_entries(
    existing: dict[str, dict], releases: list[Path], season: int | None
) -> tuple[dict[str, dict], list[str]]:
    """Add codes from older releases (in date order) missing from existing."""
    ordered = sorted(releases, key=lambda p: re.search(r"\d{4}-\d{2}-\d{2}", p.name).group(0))
    contents = [(path, read_cup(path)) for path in ordered]
    merged = dict(existing)
    added: list[str] = []
    codes = {code for _, points in contents for code in points}
    for code in sorted(codes - set(existing)):
        present = [i for i, (_, points) in enumerate(contents) if code in points]
        first, last = present[0], present[-1]
        entry: dict[str, str | int] = {"name": contents[last][1][code]}
        if first > 0:
            entry["added"] = release_year(contents[first][0])
        # Every code here is missing from the current list, so it was retired
        # by the first release after the last one that has it. If the newest
        # backfill file still has it, it was retired by the release that
        # turnpoints.ts was first generated from, whose season is --season.
        later = [release_year(p) for p, points in contents[last + 1 :] if code not in points]
        if later:
            entry["removed"] = later[0]
        elif season is not None:
            entry["removed"] = season
        else:
            print(
                f"error: {code} is in the newest backfill file but not in "
                "turnpoints.ts, so it was retired by the release turnpoints.ts "
                "was first generated from. Pass --season <that release's year>.",
                file=sys.stderr,
            )
            sys.exit(1)
        merged[code] = entry
        added.append(code)
    return merged, added


def read_header(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [line for line in path.read_text().splitlines() if line.startswith("//")]


def render(entries: dict[str, dict], header: list[str]) -> str:
    lines = [
        *header,
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
    parser.add_argument(
        "cup_path", type=Path, nargs="?", help="Path to the new .cup file"
    )
    parser.add_argument(
        "--backfill",
        type=Path,
        nargs="+",
        metavar="CUP",
        help="Older .cup releases to backfill retired codes from (see above)",
    )
    parser.add_argument(
        "--season",
        type=int,
        default=None,
        help="Season to stamp on codes added or retired in this update "
        "(required if any are)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT_PATH,
        help="Output path (defaults to src/lib/turnpoints.ts)",
    )
    args = parser.parse_args()

    existing = parse_existing(args.out)

    if args.backfill:
        if args.cup_path:
            parser.error("--backfill takes only older releases, not a new .cup file")
        entries, backfilled = backfill_entries(existing, args.backfill, args.season)
        header = read_header(args.out)
        names = ", ".join(sorted({p.name for p in args.backfill}))
        header = [h for h in header if not h.startswith("// Retired codes backfilled")]
        header.append(f"// Retired codes backfilled from: {names}.")
        args.out.write_text(render(entries, header))
        print(f"Backfilled {len(backfilled)} codes: {', '.join(backfilled) or 'none'}")
        return

    if not args.cup_path:
        parser.error("give a .cup file, or --backfill with older releases")
    cup_points = read_cup(args.cup_path)
    entries = build_entries(cup_points, existing, args.season)

    header = [
        f"// Generated by scripts/update-turnpoints.py from {args.cup_path.name}.",
        "// Do not edit by hand: rerun the script with the next BGA turnpoint file.",
        *[
            h
            for h in read_header(args.out)
            if h.startswith("// Retired codes backfilled")
        ],
    ]
    args.out.write_text(render(entries, header))
    added = sorted(c for c in cup_points if existing and c not in existing)
    retired = sorted(
        c for c in existing if c not in cup_points and "removed" not in existing[c]
    )
    print(f"Wrote {len(entries)} turnpoints to {args.out}")
    print(f"Added: {', '.join(added) or 'none'}")
    print(f"Retired: {', '.join(retired) or 'none'}")


if __name__ == "__main__":
    main()
