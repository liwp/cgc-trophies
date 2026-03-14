#!/usr/bin/env npx ts-node
/**
 * Add a pilot milestone entry to trophies.config.ts.
 *
 * Usage:
 *   npx ts-node scripts/add-milestone.ts "Last, First" 300km [year]
 *
 * If year is omitted, uses 0 (always ineligible sentinel).
 * Errors if the pilot already exists in that milestone.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const [pilotName, milestone, yearArg] = process.argv.slice(2);

if (!pilotName || !milestone) {
  console.error(
    'Usage: npx ts-node scripts/add-milestone.ts "Last, First" <milestone> [year]',
  );
  process.exit(1);
}

const year = yearArg ? parseInt(yearArg, 10) : 0;
if (isNaN(year)) {
  console.error(`Invalid year: ${yearArg}`);
  process.exit(1);
}

const configPath = path.resolve(__dirname, "..", "trophies.config.ts");
let content = fs.readFileSync(configPath, "utf-8");

// Find the milestone block, e.g. "300km": {
const milestonePattern = new RegExp(
  `("${milestone}":\\s*\\{)([^}]*)(\\})`,
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
const updatedBlock = match[1] + existingBlock + newEntry + "    " + match[3];
content = content.replace(match[0], updatedBlock);

fs.writeFileSync(configPath, content, "utf-8");

// Run prettier on the file
try {
  execSync(`npx prettier --write "${configPath}"`, { stdio: "inherit" });
} catch {
  // prettier is optional
}

console.log(
  `Added "${pilotName}" to "${milestone}" milestone with year ${year}.`,
);
