import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

const FIXTURES = join(__dirname, "fixtures");

// Header row only — used for years without a fixture (parses to zero flights).
const HEADER_ONLY = readFileSync(join(FIXTURES, "2024.csv"), "utf8").split(
  "\n",
)[0];

function csvForYear(year: string): string {
  try {
    return readFileSync(join(FIXTURES, `${year}.csv`), "utf8");
  } catch {
    return HEADER_ONLY;
  }
}

/**
 * Intercept the app's direct BGA CSV requests and reply with committed
 * per-year fixtures, so E2E tests are deterministic and offline.
 */
export async function mockFlights(page: Page) {
  await page.route("**/getlogfilescsv/**", async (route) => {
    const year = route.request().url().match(/getlogfilescsv\/(\d+)\//)?.[1];
    await route.fulfill({
      contentType: "text/csv",
      body: csvForYear(year ?? ""),
    });
  });
}
