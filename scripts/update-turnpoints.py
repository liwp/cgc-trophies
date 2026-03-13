#!/usr/bin/env python3
"""Generate src/lib/turnpoints.ts from a BGA turnpoints .cup file.

Usage:
    python3 scripts/update-turnpoints.py "resources/BGA TPs 2026-03-11.cup"
"""

import csv
import sys
from pathlib import Path

if len(sys.argv) != 2:
    print(f"Usage: {sys.argv[0]} <turnpoints.cup>", file=sys.stderr)
    sys.exit(1)

cup_path = Path(sys.argv[1])
out_path = Path(__file__).resolve().parent.parent / "src" / "lib" / "turnpoints.ts"

with open(cup_path) as f:
    reader = csv.DictReader(f)
    pairs = sorted(
        ((row["code"].strip(), row["name"].strip()) for row in reader if row["code"].strip() and row["name"].strip()),
        key=lambda p: p[0],
    )

lines = ["const TURNPOINTS: Record<string, string> = {"]
for code, name in pairs:
    escaped = name.replace("\\", "\\\\").replace('"', '\\"')
    lines.append(f'  "{code}": "{escaped}",')
lines.append("};")
lines.append("")
lines.append("export default TURNPOINTS;")
lines.append("")

out_path.write_text("\n".join(lines))
print(f"Wrote {len(pairs)} turnpoints to {out_path}")
