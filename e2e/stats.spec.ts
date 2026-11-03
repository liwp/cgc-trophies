import { expect, type Page, test } from "@playwright/test";
import { mockFlights } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

const tile = (page: Page, label: string) =>
  page
    .getByRole("list", { name: "Season summary" })
    .getByRole("listitem")
    .filter({ has: page.getByText(label, { exact: true }) });

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
  await expect(tile(page, "km")).toContainText("99,445");
  await expect(tile(page, "Declared")).toContainText("94%");
  await expect(tile(page, "Completed")).toContainText("−6%");
});

test("the tiles go from how much was flown to how it was flown", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  await expect(
    page
      .getByRole("list", { name: "Season summary" })
      .getByRole("listitem")
      .locator("div:first-child"),
  ).toHaveText(["Flights", "Pilots", "km", "Points", "Declared", "Completed"]);
});

test("the stats default to Gransden Lodge launches", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const toggle = page.getByRole("switch", { name: /Gransden Lodge/ });

  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(tile(page, "Flights")).toContainText("368");
  await expect(tile(page, "Completed")).toContainText("79%");

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
  const pilots = rows.first().getByRole("link");
  await expect(pilots).toHaveCount(1);
  await expand.click();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  await expect(pilots).toHaveCount(15);
  // Each flight's distance sits in its own column, on the same line
  const distances = rows.first().getByRole("cell").nth(3).getByRole("listitem");
  await expect(distances).toHaveCount(15);
  await expect(distances.first()).toHaveText(/^[\d,]+ km$/);
  await expand.click();
  await expect(pilots).toHaveCount(1);
});

// Expanding rows must not move a table's columns, at any width.
for (const { section, season, expand, why, rows } of [
  {
    section: "Best days",
    // 2022 has days whose expanded names widen the flights column.
    season: 2022,
    expand: /^All flights on /,
    why: "a day",
    rows: 10,
  },
  {
    section: "Top tasks",
    season: 2024,
    expand: /^Flights of /,
    why: "a task",
    rows: 10,
  },
  {
    section: "Club gliders",
    season: 2024,
    expand: /^Flights in /,
    why: "a glider",
    rows: 8,
  },
]) {
  for (const [device, viewport] of [
    ["desktop", { width: 1280, height: 800 }],
    ["laptop", { width: 1024, height: 768 }],
    ["tablet", { width: 768, height: 1024 }],
    ["phone", { width: 360, height: 740 }],
  ] as const) {
    test(`${section.toLowerCase()} columns stay put when ${why} expands on a ${device}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/stats?season=${season}`);
      const table = page
        .getByRole("region", { name: section })
        .getByRole("table");
      const columns = () =>
        table.locator("thead th").evaluateAll((ths) =>
          ths.map((th) => {
            const { x, width } = th.getBoundingClientRect();
            const left = th.closest("table")?.getBoundingClientRect().x ?? 0;
            return [Math.round(x - left), Math.round(width)];
          }),
        );
      await expect(table.locator("tbody tr")).toHaveCount(rows);
      const before = await columns();
      for (const button of await table
        .getByRole("button", { name: expand })
        .all()) {
        await button.click();
        await expect(button).toHaveAttribute("aria-expanded", "true");
        expect(await columns()).toEqual(before);
      }
    });
  }
}

test("best days shows each flight's task where there's room", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/stats?season=2024");
  const region = page.getByRole("region", { name: "Best days" });
  const task = region
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: "GRL – DEV – CAS – BAN – GRL" });
  await expect(task).toBeVisible();
  await task.hover();
  await expect(
    region.getByRole("tooltip").filter({ hasText: /^Gransden Lodge – / }),
  ).toBeVisible();

  await page.setViewportSize({ width: 360, height: 740 });
  await expect(region.getByRole("columnheader", { name: "Task" })).toBeHidden();
  await expect(task).toBeHidden();
});

test("best days fits a phone without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/stats?season=2024");
  const card = page
    .getByRole("region", { name: "Best days" })
    .locator("div:has(> table)");
  const row = card.locator("tbody tr").first();
  // A phone shows the date without its weekday, and an initial and surname,
  // with the pilot's full name kept for screen readers.
  await expect(row.getByRole("cell").first()).toHaveText("28 Jul", {
    useInnerText: true,
  });
  await expect(row.getByRole("link", { name: "Graham Drury" })).toHaveText(
    "G Drury",
    { useInnerText: true },
  );
  await expect(row).toContainText("15 flights");
  await row.getByRole("button", { name: "All flights on Sun 28 Jul" }).click();
  expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});

test("top tasks fits a phone without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/stats?season=2024");
  const card = page
    .getByRole("region", { name: "Top tasks" })
    .locator("div:has(> table)");
  const rows = card.locator("tbody tr");
  // The task's distance sits under its route, the percentage under the count
  await expect(rows.first().getByRole("cell").first()).toContainText("306 km");
  await expect(rows.first().getByRole("cell").nth(1)).toHaveText(
    /28 \/ 31\s*90%/,
  );
  await rows
    .first()
    .getByRole("button", { name: /^Flights of/ })
    .click();
  await expect(rows.nth(1).getByRole("link", { name: /\w+ \w+/ })).toHaveText(
    /^[A-Z] \S+/,
    { useInnerText: true },
  );
  expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
});

test("the tasks charts show completions by distance and shape", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  const distance = page.getByRole("figure", { name: /By distance/ });
  await expect(distance.getByRole("img")).toHaveCount(6);
  await expect(
    distance.getByRole("img", {
      name: "300\u00a0km: 120 / 145 completed (83%)",
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
  await expect(rows.first()).toContainText("28 / 31");
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
  await expect(rows.nth(1)).toContainText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /, {
    useInnerText: true,
  });
  await expect(
    page.getByRole("button", { name: /distance penalty/ }),
  ).not.toHaveCount(0);
  await expect(rows.nth(31)).toContainText("Not completed");
  // Knight's undeclared flight completed the task, so it has a speed.
  await expect(rows.filter({ hasText: "Knight" })).toContainText("kph");
  await rows
    .first()
    .getByRole("button", { name: /Flights of/ })
    .click();
  await expect(rows).toHaveCount(10);
});

test("the season highlights show each card's winner", async ({ page }) => {
  await page.goto("/stats?season=2024");
  const highlights = page.getByRole("region", { name: "Season highlights" });
  const card = (title: string) =>
    highlights.getByRole("listitem").filter({ hasText: title });
  await expect(card("Most flights")).toBeVisible();
  await expect(card("Most flights")).toContainText("28 flights");
  await expect(card("Most flights")).toContainText("Wendy Head");
  await expect(card("Longest flight")).toContainText("758.2 km");
  await expect(
    card("Longest flight").getByRole("link", { name: "Alex Holswilder" }),
  ).toHaveAttribute("href", /bgaladder\.net\/flightdetails/);
  await expect(card("Top scoring flight")).toContainText("pts");
  await expect(card("Longest FAI triangle")).toContainText("km");
  await expect(highlights.locator("> ul > li")).toHaveCount(8);

  // A lone first flight shows its pilot directly
  const first = highlights
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
    .getByRole("region", { name: "Season highlights" })
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
    /Discus DM\s*G-CJXR · 7 flights/,
    "67.4 kph",
    "821 km",
    "",
  ]);
  // Unflown club gliders are listed too
  await expect(row("Puchacz JEC").getByRole("cell").first()).toContainText(
    "0 flights",
  );
});

test("club gliders fits a phone without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/stats?season=2024");
  const card = page
    .getByRole("region", { name: "Club gliders" })
    .locator("div:has(> table)");
  await card.getByRole("button", { name: "Flights in Discus DM" }).click();
  await expect(
    card
      .locator("tbody tr")
      .filter({ has: page.getByRole("link") })
      .first(),
  ).toHaveText(
    // The pilot, then the date and task under it
    /^[A-Z] \S+\s+\d+ \w{3,4} · GRL – /,
    { useInnerText: true },
  );
  expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
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

test("the stats sections read from overview to detail", async ({ page }) => {
  await page.goto("/stats?season=2024");
  await expect(page.getByRole("heading", { name: "Pilots" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Season highlights",
    "By month",
    "Best days",
    "Tasks",
    "Top tasks",
    "Club gliders",
    "Pilots",
  ]);
});
