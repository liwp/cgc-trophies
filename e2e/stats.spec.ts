import { expect, type Page, test } from "@playwright/test";
import { mockFlights } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

const tile = (page: Page, label: string) =>
  page
    .getByRole("list", { name: "Season summary" })
    .getByRole("listitem")
    .filter({ hasText: label });

test("the home page links to the season's stats", async ({ page }) => {
  await page.goto("/?season=2024");
  await page.getByRole("link", { name: "Season stats" }).click();

  await expect(page).toHaveURL(/\/stats\?season=2024/);
  await expect(
    page.getByRole("heading", { name: "CGC 2024 Stats" }),
  ).toBeVisible();
});

test("the tiles total all club flights with the change from last season", async ({
  page,
}) => {
  await page.goto("/stats?season=2024&site=all");

  await expect(tile(page, "Flights")).toContainText("388");
  await expect(tile(page, "Flights")).toContainText("+103");
  await expect(tile(page, "Gliders")).toContainText("−1");
  await expect(tile(page, "Scoring km")).toContainText("99,445");
  await expect(tile(page, "Declared")).toContainText("94%");
});

test("the stats default to Gransden Lodge launches", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const toggle = page.getByRole("switch", { name: /Gransden Lodge/ });

  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(tile(page, "Flights")).toContainText("368");
  await expect(tile(page, "Completed tasks")).toContainText("273");

  await toggle.click();
  await expect(page).toHaveURL(/site=all/);
  await expect(tile(page, "Flights")).toContainText("388");
});

test("the stats page links to the other pages", async ({ page }) => {
  await page.goto("/stats?season=2024");
  await expect(page.getByRole("link", { name: "Season stats" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Admin view" })).toHaveAttribute(
    "href",
    "/admin?season=2024",
  );
  await page.getByRole("link", { name: "Trophies" }).click();
  await expect(
    page.getByRole("heading", { name: "CGC 2024 Trophies" }),
  ).toBeVisible();
});

test("the stats fit a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/stats?season=2024");
  await expect(tile(page, "Flights")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

const pilots = (page: Page) => page.getByRole("region", { name: "Pilots" });
const pilotRows = (page: Page) => pilots(page).locator("tbody tr");

test("the pilot table lists pilots by points and sorts by any column", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  await expect(pilotRows(page)).toHaveCount(10);
  await page.getByRole("switch", { name: "Top 10 only" }).click();
  await expect(pilotRows(page)).toHaveCount(43);
  const pointsHeader = pilots(page).getByRole("columnheader", {
    name: "Points",
  });
  await expect(pointsHeader).toHaveAttribute("aria-sort", "descending");

  await pilots(page)
    .getByRole("button", { name: "Pilot", exact: true })
    .click();
  await expect(
    pilots(page).getByRole("columnheader", { name: "Pilot" }),
  ).toHaveAttribute("aria-sort", "ascending");
  const names = await pilotRows(page)
    .locator("td:first-child")
    .allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

  await pilots(page)
    .getByRole("button", { name: "Pilot", exact: true })
    .click();
  await expect(
    pilots(page).getByRole("columnheader", { name: "Pilot" }),
  ).toHaveAttribute("aria-sort", "descending");
});

test("the pilot table scrolls inside its card on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/stats?season=2024");
  await expect(pilotRows(page).first()).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("the monthly charts show each month's flights and km", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  const flights = page.getByRole("figure", { name: "Flights" });
  await expect(flights.getByRole("img")).toHaveCount(12);
  await expect(
    flights.getByRole("img", {
      name: /^May 2024: 53 flights, May 2023: \d+ flights$/,
    }),
  ).toBeVisible();

  const km = page.getByRole("figure", { name: "Scoring km" });
  await expect(km).toContainText("27,881 km");
  await km.getByRole("img", { name: /July 2024/ }).focus();
  await expect(km.getByText("July 2024: 27,881 km")).toBeVisible();
});

test("best days ranks the season's days by total km", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const rows = page
    .getByRole("region", { name: "Best days" })
    .locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText("Sun 28 Jul");
  await expect(rows.first()).toContainText("6,647 km");
  await expect(
    rows.first().getByRole("link", { name: "Graham Drury" }),
  ).toHaveAttribute("href", /bgaladder\.net\/flightdetails/);

  const expand = rows
    .first()
    .getByRole("button", { name: "All flights on Sun 28 Jul" });
  await expect(rows.first().locator("li")).toHaveCount(1);
  await expand.click();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  await expect(rows.first().locator("li")).toHaveCount(15);
  await expand.click();
  await expect(rows.first().locator("li")).toHaveCount(1);
});

test("the tasks charts show completions by distance and shape", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  const distance = page.getByRole("figure", { name: /By distance/ });
  await expect(distance.getByRole("img")).toHaveCount(6);
  await expect(
    distance.getByRole("img", {
      name: "300\u00a0km: 118 / 145 completed (81%)",
    }),
  ).toBeVisible();
  await expect(
    distance.getByRole("img", { name: "600\u00a0km: 0 / 0 completed" }),
  ).toBeAttached();
  await expect(
    page
      .getByRole("figure", { name: /By shape/ })
      .getByRole("img", { name: /^FAI triangle: \d+ \/ \d+ completed/ }),
  ).toBeVisible();
});

test("top tasks counts a task and its reverse together", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const rows = page
    .getByRole("region", { name: "Top tasks" })
    .locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText("GRL – CAL – EAW – SOH – GRL");
  await expect(rows.first()).toContainText("27 / 31");
  // Flown 6 times one way round and 5 the other
  const rusRam = rows.filter({ hasText: /RUS – RAM|RAM – RUS/ });
  await expect(rusRam).toHaveCount(1);
  await expect(rusRam).toContainText("/ 11");
});

test("a top task expands to its flights", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const rows = page
    .getByRole("region", { name: "Top tasks" })
    .locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await rows.first().click();
  await expect(rows).toHaveCount(10 + 31);
  await expect(
    rows.first().getByRole("button", { name: /Flights of/ }),
  ).toHaveAttribute("aria-expanded", "true");
  // Completed flights fastest first, the rest after
  await expect(rows.nth(1)).toContainText("kph");
  await expect(rows.nth(1)).toContainText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /);
  await expect(
    page.getByRole("button", { name: /distance penalty/ }),
  ).not.toHaveCount(0);
  await expect(rows.nth(31)).toContainText("Not completed");
  await rows
    .first()
    .getByRole("button", { name: /Flights of/ })
    .click();
  await expect(rows).toHaveCount(10);
});

test("the season awards show each card's winner", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const awards = page.getByRole("region", { name: "Season awards" });
  const card = (title: string) =>
    awards.getByRole("listitem").filter({ hasText: title });
  await expect(card("Most flights")).toBeVisible();
  await expect(card("Most flights")).toContainText("28 flights");
  await expect(card("Most flights")).toContainText("Wendy Head");
  await expect(card("Longest flight")).toContainText("758.2 km");
  await expect(
    card("Longest flight").getByRole("link", { name: "Alex Holswilder" }),
  ).toHaveAttribute("href", /bgaladder\.net\/flightdetails/);
  await expect(card("Top scoring flight")).toContainText("pts");
  await expect(card("Longest FAI triangle")).toContainText("km");
  await expect(awards.locator("> ul > li")).toHaveCount(8);

  // A lone first flight shows its pilot directly
  const first = awards
    .locator("> ul > li")
    .filter({ hasText: "First flights" });
  await expect(first).toContainText("26 Mar");
  await expect(
    first.getByRole("link", { name: "Paul Bonhomme" }),
  ).toBeVisible();
  await expect(first.getByRole("button")).toHaveCount(0);
});

test("a day award with several pilots expands to them", async ({ page }) => {
  await page.goto("/stats?season=2025");
  const first = page
    .getByRole("region", { name: "Season awards" })
    .locator("> ul > li")
    .filter({ hasText: "First flights" });
  await expect(first).toContainText("15 Mar");
  await expect(first).toContainText("3 pilots");
  await expect(first.getByRole("link")).toHaveCount(0);
  await first
    .getByRole("button", { name: "First flights: all flights" })
    .click();
  await expect(first.getByRole("link")).toHaveCount(3);
  await expect(
    first.getByRole("link", { name: "Alex Holswilder" }),
  ).toBeVisible();
});

test("the club glider table lists each club glider's season", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  const table = page
    .getByRole("region", { name: "Club gliders" })
    .getByRole("table");
  const row = (name: string) =>
    table.getByRole("row").filter({ hasText: name });

  await expect(table.getByRole("row")).toHaveCount(9);
  await expect(row("Discus DM").getByRole("cell")).toHaveText([
    /Discus DM\s*G-CJXR/,
    "7",
    "67.4 kph",
    "821",
    "",
  ]);
  // Unflown club gliders are listed too
  await expect(row("Puchacz JEC").getByRole("cell").nth(1)).toHaveText("0");
});

test("a club glider row expands to its flights", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const section = page.getByRole("region", { name: "Club gliders" });
  const rows = section.getByRole("row");
  await expect(rows).toHaveCount(9);

  const expand = section.getByRole("button", { name: "Flights in Discus DM" });
  await expand.click();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  await expect(rows).toHaveCount(9 + 7);
  // Each flight shows its speed, or that it didn't complete its task
  const flightRows = rows.filter({ has: page.getByRole("link") });
  await expect(
    flightRows.filter({ hasText: /\d kph|Not completed/ }),
  ).toHaveCount(7);
  await expect(
    section.getByRole("link", { name: /\w/ }).first(),
  ).toHaveAttribute("href", /bgaladder\.net\/flightdetails\//);

  await expand.click();
  await expect(rows).toHaveCount(9);
  // An unflown glider has nothing to expand
  await expect(
    section.getByRole("button", { name: "Flights in Puchacz JEC" }),
  ).toHaveCount(0);
});
