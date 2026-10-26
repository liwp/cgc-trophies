#!/usr/bin/env bun
/**
 * Add a pilot milestone entry to trophies.config.ts.
 *
 * Usage:
 *   bun scripts/add-milestone.ts "Last, First" 300km [year]
 *
 * If year is omitted, uses 0 (always ineligible sentinel).
 * Errors if the pilot already exists in that milestone.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [pilotName, milestone, yearArg] = process.argv.slice(2);

if (!pilotName || !milestone) {
  console.error(
    'Usage: bun scripts/add-milestone.ts "Last, First" <milestone> [year]',
  );
  process.exit(1);
}

const year = yearArg ? parseInt(yearArg, 10) : 0;
if (Number.isNaN(year)) {
  console.error(`Invalid year: ${yearArg}`);
  process.exit(1);
}

const configPath = path.resolve(
  import.meta.dirname,
  "..",
  "trophies.config.ts",
);
let content = fs.readFileSync(configPath, "utf-8");

// Find the milestone block, e.g. "300km": {
const escapedMilestone = milestone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const milestonePattern = new RegExp(
  `("${escapedMilestone}":\\s*\\{)([^}]*)(\\})`,
  "s",
);
const match = content.match(milestonePattern);

if (!match) {
  console.error(
    `Milestone "${milestone}" not found in trophies.config.ts. ` +
      `Add it manually first.`,
  );
  process.exit(1);
}

const existingBlock = match[2];
if (existingBlock.includes(`"${pilotName}"`)) {
  console.error(
    `Pilot "${pilotName}" already exists in milestone "${milestone}".`,
  );
  process.exit(1);
}

// Insert the new entry before the closing brace
const newEntry = `      "${pilotName}": ${year},\n`;
const updatedBlock = `${match[1] + existingBlock + newEntry}    ${match[3]}`;
content = content.replace(match[0], updatedBlock);

fs.writeFileSync(configPath, content, "utf-8");

// Format the file with Biome
try {
  execSync(`bunx biome format --write "${configPath}"`, { stdio: "inherit" });
} catch {
  // formatting is optional
}

console.log(
  `Added "${pilotName}" to "${milestone}" milestone with year ${year}.`,
);
