import { expect, type Page, test } from "@playwright/test";
import { mockFlights } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

const region = (page: Page, name: string) => page.getByRole("region", { name });

/** Top tasks with its first (most flown) task expanded. */
async function topTaskFlights(page: Page) {
  await page.goto("/stats?season=2024");
  const rows = region(page, "Top tasks").locator("tbody tr");
  await rows
    .first()
    .getByRole("button", { name: /Flights of/ })
    .click();
  return rows;
}

test("a flight's pop-up shows its details", async ({ page }) => {
  const rows = await topTaskFlights(page);
  const flight = rows.nth(1);
  const pilot = await flight
    .getByRole("button", { name: /^Flight details for / })
    .getAttribute("aria-label");
  const name = pilot?.replace("Flight details for ", "") ?? "";

  // Anywhere on the row opens it, not just the pilot's name.
  await flight.getByRole("cell").last().click();
  const dialog = page.getByRole("dialog", { name: new RegExp(name) });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Handicap\s*\d+/);
  await expect(dialog).toContainText(/G-[A-Z]{4}/);
  await expect(dialog).toContainText(/Speed\s*[\d.]+ kph/);
  await expect(dialog).toContainText(/Handicapped speed\s*[\d.]+ kph/);
  await expect(dialog).toContainText(/Points\s*[\d.]+ pts/);
  await expect(
    dialog.getByRole("link", { name: "BGA Ladder" }),
  ).toHaveAttribute("href", /bgaladder\.net\/flightdetails\/\d+/);
});

test("the pop-up closes with Esc, the close button and a click outside", async ({
  page,
}) => {
  const rows = await topTaskFlights(page);
  const pilot = rows
    .nth(1)
    .getByRole("button", { name: /^Flight details for / });
  const dialog = page.getByRole("dialog");

  await pilot.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(pilot).toBeFocused();

  await pilot.click();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await expect(pilot).toBeFocused();

  await pilot.click();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test("the pilot's name opens the pop-up from the keyboard", async ({
  page,
}) => {
  const rows = await topTaskFlights(page);
  await rows
    .nth(1)
    .getByRole("button", { name: /^Flight details for / })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("stats tables no longer link straight to the ladder", async ({ page }) => {
  await page.goto("/stats?season=2024");
  for (const name of ["Best days", "Top tasks", "Club gliders"]) {
    const table = region(page, name).getByRole("table");
    const expand = table.getByRole("button", { expanded: false });
    while ((await expand.count()) > 0) await expand.first().click();
    await expect(table.getByRole("link")).toHaveCount(0);
  }
});

test("best days: a flight line opens its pop-up; the chevron only expands the day", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  const day = region(page, "Best days").locator("tbody tr").first();
  const expand = day.getByRole("button", { name: "All flights on Sun 28 Jul" });
  const dialog = page.getByRole("dialog");

  await expand.click();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  await expect(dialog).toBeHidden();

  // The second flight's distance, in its own cell, opens that flight.
  const pilot = day.getByRole("cell").nth(2).getByRole("listitem").nth(1);
  const name = (
    await pilot.getByRole("button").getAttribute("aria-label")
  )?.replace("Flight details for ", "");
  await day.getByRole("cell").nth(3).getByRole("listitem").nth(1).click();
  await expect(
    page.getByRole("dialog", { name: new RegExp(name ?? "") }),
  ).toBeVisible();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
});

test("the height-loss tooltip shows inside the pop-up", async ({ page }) => {
  const rows = await topTaskFlights(page);
  const penalised = rows.filter({
    has: page.getByRole("button", { name: /distance penalty/ }),
  });
  await penalised
    .first()
    .getByRole("button", { name: /^Flight details/ })
    .click();
  const dialog = page.getByRole("dialog");
  const warning = dialog.getByRole("button", { name: /distance penalty/ });
  await warning.focus();
  const tooltip = dialog.getByRole("tooltip", { name: /distance penalty/ });
  await expect(tooltip).toBeVisible();
  const box = await tooltip.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
});

test.describe("on a touch phone @touch", () => {
  test("the pop-up is a sheet at the bottom that fits the screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const rows = await topTaskFlights(page);
    await rows
      .nth(1)
      .getByRole("button", { name: /^Flight details for / })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(
      Math.abs((box?.y ?? 0) + (box?.height ?? 0) - 740),
    ).toBeLessThanOrEqual(1);
    expect(box?.width).toBeLessThanOrEqual(360);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

/** Expand every row of the three flight tables. */
async function expandAll(page: Page) {
  for (const name of ["Best days", "Top tasks", "Club gliders"]) {
    const table = region(page, name).getByRole("table");
    const expand = table.getByRole("button", { expanded: false });
    while ((await expand.count()) > 0) await expand.first().click();
  }
}

// Alex Holswilder's 17 Jul 2024 flight: first on three trophies, third on one.
const GOLDS = "Gold: Pot Pewter Pringle, Complicity Cup, Jubilee Bowl";

test("a podium flight shows its best medal next to the pilot, with a tooltip naming the trophies", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  await expandAll(page);
  const medal = page.getByRole("button", { name: GOLDS }).first();
  await expect(medal).toBeVisible();
  await medal.hover();
  const tooltip = page.getByRole("tooltip").filter({ hasText: "Jubilee Bowl" });
  await expect(tooltip.first()).toBeVisible();
  await expect(tooltip.first()).toContainText("Pot Pewter Pringle");
  await expect(tooltip.first()).toContainText("Complicity Cup");
});

test("the pop-up lists every podium place, best first", async ({ page }) => {
  await page.goto("/stats?season=2024");
  await expandAll(page);
  const row = page
    .getByRole("listitem")
    .or(page.getByRole("row"))
    .filter({ has: page.getByRole("button", { name: GOLDS }) })
    .last();
  await row.getByRole("button", { name: /^Flight details for / }).click();
  const trophies = page
    .getByRole("dialog")
    .getByRole("list", { name: "Trophies" })
    .getByRole("listitem");
  await expect(trophies).toHaveText([
    "Gold · Pot Pewter Pringle",
    "Gold · Complicity Cup",
    "Gold · Jubilee Bowl",
    "Bronze · Mug Metal Machin Trophy",
  ]);
});

test("a flight on no podium has no medal and no trophies section", async ({
  page,
}) => {
  const rows = await topTaskFlights(page);
  const plain = rows
    .filter({ has: page.getByRole("button", { name: /^Flight details/ }) })
    .filter({
      hasNot: page.getByRole("button", { name: /^(Gold|Silver|Bronze): / }),
    })
    .first();
  await plain.getByRole("button", { name: /^Flight details/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("list", { name: "Trophies" }),
  ).toHaveCount(0);
});

test("medals follow the selected season", async ({ page }) => {
  const medals = async (season: number) => {
    await page.goto(`/stats?season=${season}`);
    await expandAll(page);
    return page
      .getByRole("button", { name: /^(Gold|Silver|Bronze): / })
      .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
  };
  const in2024 = await medals(2024);
  expect(in2024).toContain(GOLDS);
  expect(await medals(2023)).not.toContain(GOLDS);
});

test.describe("on a touch phone @touch", () => {
  test.use({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  });

  test("tapping a medal shows its tooltip without opening the pop-up", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/stats?season=2024");
    await expandAll(page);
    const medal = page.getByRole("button", { name: GOLDS }).first();
    await medal.tap();
    await expect(
      page.getByRole("tooltip").filter({ hasText: "Jubilee Bowl" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("the pop-up with long trophy names fits the screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/stats?season=2024");
    await expandAll(page);
    const row = page
      .getByRole("listitem")
      .or(page.getByRole("row"))
      .filter({ has: page.getByRole("button", { name: GOLDS }) })
      .last();
    await row.getByRole("button", { name: /^Flight details for / }).tap();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("list", { name: "Trophies" })).toBeVisible();
    const box = await dialog.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("a pop-up taller than the screen scrolls to its last trophy", async ({
  page,
}) => {
  // A phone on its side: wider than a phone, so the centred dialog, but short.
  await page.setViewportSize({ width: 740, height: 360 });
  await page.goto("/stats?season=2024");
  await expandAll(page);
  await page
    .getByRole("listitem")
    .or(page.getByRole("row"))
    .filter({ has: page.getByRole("button", { name: GOLDS }) })
    .last()
    .getByRole("button", { name: /^Flight details for / })
    .click();
  const last = page
    .getByRole("dialog")
    .getByRole("list", { name: "Trophies" })
    .getByRole("listitem")
    .last();
  await last.scrollIntoViewIfNeeded();
  const box = await last.boundingBox();
  expect(box?.y).toBeGreaterThanOrEqual(0);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(360);
});

test("the height-loss tooltip in the pop-up stays on a phone's screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const rows = await topTaskFlights(page);
  await rows
    .filter({ has: page.getByRole("button", { name: /distance penalty/ }) })
    .first()
    .getByRole("button", { name: /^Flight details/ })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /distance penalty/ }).hover();
  const tooltip = dialog.getByRole("tooltip", { name: /distance penalty/ });
  await expect(tooltip).toBeVisible();
  const box = await tooltip.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360);
  expect(box?.y).toBeGreaterThanOrEqual(0);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(740);
});
