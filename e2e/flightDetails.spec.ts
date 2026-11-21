import { expect, type Page, test } from "@playwright/test";
import { mockFlights } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

/** Wait for a sliding sheet to come to rest. */
const settled = (page: Page) =>
  page
    .getByRole("dialog")
    .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));

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
    // Before counting what's left to expand: until the flights load, nothing.
    await expect(table.locator("tbody tr").first()).toBeVisible();
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
    await settled(page);
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
    // Before counting what's left to expand: until the flights load, nothing.
    await expect(table.locator("tbody tr").first()).toBeVisible();
    const expand = table.getByRole("button", { expanded: false });
    while ((await expand.count()) > 0) await expand.first().click();
  }
}

// Alex Holswilder's 17 Jul 2024 flight: first on three trophies, third on one.
const GOLDS =
  "Trophies: Gold · Pot Pewter Pringle, Gold · Complicity Cup, Gold · Jubilee Bowl, Bronze · Mug Metal Machin Trophy";

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
  // Every podium place, not just the best, each with its own medal.
  await expect(tooltip.first().locator("> span")).toHaveText([
    "Gold · Pot Pewter Pringle",
    "Gold · Complicity Cup",
    "Gold · Jubilee Bowl",
    "Bronze · Mug Metal Machin Trophy",
  ]);
  await expect(tooltip.first().locator("svg")).toHaveCount(4);
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
  await expect(trophies).toHaveText(
    [
      /^Gold · Pot Pewter Pringle\s/,
      /^Gold · Complicity Cup\s/,
      /^Gold · Jubilee Bowl\s/,
      /^Bronze · Mug Metal Machin Trophy\s/,
    ],
    { useInnerText: true },
  );
});

test("a flight on no podium has no medal and no trophies section", async ({
  page,
}) => {
  const rows = await topTaskFlights(page);
  const plain = rows
    .filter({ has: page.getByRole("button", { name: /^Flight details/ }) })
    .filter({
      hasNot: page.getByRole("button", { name: /^Trophies: / }),
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
      .getByRole("button", { name: /^Trophies: / })
      .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
  };
  const in2024 = await medals(2024);
  expect(in2024).toContain(GOLDS);
  expect(await medals(2023)).not.toContain(GOLDS);
});

test.describe("medals on a touch phone @touch", () => {
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

/** Whether the middle of `box` shows the element itself, not something over it or a clipped edge. */
const showsAt = (
  page: Page,
  box: { x: number; y: number; width: number; height: number } | null,
  selector: string,
) =>
  page.evaluate(
    ([cx, cy, sel]) =>
      document
        .elementFromPoint(cx as number, cy as number)
        ?.closest(sel as string) !== null,
    [
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
      selector,
    ],
  );

test("a row medal's tooltip shows in full, outside the table's card", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  await expandAll(page);
  const medal = page.getByRole("button", { name: GOLDS }).first();
  await medal.hover();
  const tooltip = page
    .getByRole("tooltip")
    .filter({ hasText: "Jubilee Bowl" })
    .first();
  await expect(tooltip).toBeVisible();
  // Nothing clips it: the card's scrolling box would hide it.
  expect(
    await showsAt(page, await tooltip.boundingBox(), "[role=tooltip]"),
  ).toBe(true);
});

test("a row medal has the row's pointer, not a help cursor", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  await expandAll(page);
  const medal = page.getByRole("button", { name: GOLDS }).first();
  await expect(medal).not.toHaveCSS("cursor", "help");
});

/** Open the 17 Jul 2024 Holswilder flight's pop-up. */
async function openGolds(page: Page) {
  await page.goto("/stats?season=2024");
  await expandAll(page);
  await page
    .getByRole("listitem")
    .or(page.getByRole("row"))
    .filter({ has: page.getByRole("button", { name: GOLDS }) })
    .last()
    .getByRole("button", { name: /^Flight details for / })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await settled(page);
  return page.getByRole("dialog");
}

test("opening the pop-up shows no tooltip until asked", async ({ page }) => {
  const dialog = await openGolds(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(dialog.getByRole("tooltip", { name: "BGA Ladder" })).toHaveCSS(
    "opacity",
    "0",
  );
});

test("the ladder link's tooltip in the pop-up isn't cut off", async ({
  page,
}) => {
  const dialog = await openGolds(page);
  await dialog.getByRole("link", { name: "BGA Ladder" }).hover();
  const tooltip = dialog.getByRole("tooltip", { name: "BGA Ladder" });
  await expect(tooltip).toHaveCSS("opacity", "1");
  const box = await tooltip.boundingBox();
  const frame = await dialog.boundingBox();
  expect(box?.y).toBeGreaterThanOrEqual(frame?.y ?? 0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    (frame?.x ?? 0) + (frame?.width ?? 0),
  );
});

test("a trophy in the pop-up links to its page, its summary underneath", async ({
  page,
}) => {
  const dialog = await openGolds(page);
  const trophy = dialog
    .getByRole("list", { name: "Trophies" })
    .getByRole("listitem")
    .first();
  await expect(trophy).toContainText("Open ladder");
  const link = trophy.getByRole("link", { name: "Pot Pewter Pringle" });
  await expect(link).toHaveAttribute("href", "/trophy/L1?season=2024");
  await link.click();
  await expect(page).toHaveURL(/\/trophy\/L1\?season=2024$/);
});

test("a tooltip stays open a moment after the pointer leaves, and while it's on the tooltip", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  await expandAll(page);
  const medal = page.getByRole("button", { name: GOLDS }).first();
  const tooltip = page
    .getByRole("tooltip")
    .filter({ hasText: "Jubilee Bowl" })
    .first();
  await medal.hover();
  await expect(tooltip).toBeVisible();
  // Moving onto the tooltip, across the gap, keeps it open.
  const box = await tooltip.boundingBox();
  await page.mouse.move(
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2,
    { steps: 5 },
  );
  await page.waitForTimeout(500);
  await expect(tooltip).toBeVisible();
  // Leaving both, it closes after a moment.
  await page.mouse.move(5, 5);
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toBeHidden({ timeout: 1000 });
});

test("the desktop pop-up fades in, with no motion when reduced", async ({
  page,
}) => {
  const dialog = await openGolds(page);
  const transition = () =>
    dialog.evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(await transition()).toContain("opacity");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await transition()).not.toContain("opacity");
});

test.describe("the pop-up sheet on a phone @touch", () => {
  test.use({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  });

  test("a tooltip near the bottom of the screen opens above it", async ({
    page,
  }) => {
    await page.goto("/stats?season=2024");
    await expandAll(page);
    // A medal at the very bottom of the screen.
    const medal = page.getByRole("button", { name: GOLDS }).first();
    await medal.evaluate((el) => el.scrollIntoView({ block: "end" }));
    await medal.tap();
    const tooltip = page
      .getByRole("tooltip")
      .filter({ hasText: "Jubilee Bowl" })
      .first();
    await expect(tooltip).toBeVisible();
    const box = await tooltip.boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual(0);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(740);
  });

  test("the sheet slides up as it opens and down as it closes", async ({
    page,
  }) => {
    const dialog = await openGolds(page);
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((el) => getComputedStyle(el).transitionProperty),
    ).toContain("translate");
    // It ends up resting on the bottom edge.
    await expect
      .poll(async () => {
        const box = await dialog.boundingBox();
        return Math.round((box?.y ?? 0) + (box?.height ?? 0));
      })
      .toBe(740);
    // Closing keeps its content while it slides away.
    await dialog.getByRole("button", { name: "Close" }).tap();
    await expect(dialog).toBeHidden();
    await expect(page.locator("dialog h2")).toHaveCount(1);
  });

  test("with reduced motion the sheet doesn't slide", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const dialog = await openGolds(page);
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((el) => getComputedStyle(el).transitionProperty),
    ).not.toContain("translate");
  });
});

test("a trophy followed from far down the stats page opens at its top", async ({
  page,
}) => {
  // Its flight is the last row of the expanded tables, far down the page.
  const dialog = await openGolds(page);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await dialog
    .getByRole("list", { name: "Trophies" })
    .getByRole("link", { name: "Pot Pewter Pringle" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pot Pewter Pringle" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test.describe("the open pop-up is in the URL", () => {
  const FLIGHT = /[?&]flight=[^&]+/;

  test("opening a flight adds it to the URL, closing takes it out", async ({
    page,
  }) => {
    const dialog = await openGolds(page);
    await expect(page).toHaveURL(FLIGHT);
    await expect(page).toHaveURL(/season=2024/);
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(FLIGHT);
  });

  test("Back from a trophy page reopens the pop-up", async ({ page }) => {
    const dialog = await openGolds(page);
    const name = await dialog.getByRole("heading", { level: 2 }).textContent();
    await dialog
      .getByRole("list", { name: "Trophies" })
      .getByRole("link", { name: "Pot Pewter Pringle" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Pot Pewter Pringle" }),
    ).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("heading", { level: 2 }),
    ).toHaveText(name ?? "");
  });

  test("Back while it's open closes it, and Forward reopens it", async ({
    page,
  }) => {
    const dialog = await openGolds(page);
    await page.goBack();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/stats\?season=2024$/);
    await page.goForward();
    await expect(dialog).toBeVisible();
  });

  test("closing it goes back, not forward to a new entry", async ({ page }) => {
    const dialog = await openGolds(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // Back now leaves the stats page rather than reopening the pop-up.
    await page.goForward();
    await expect(dialog).toBeVisible();
  });

  test("a shared link opens the pop-up, and closing it stays on the page", async ({
    page,
  }) => {
    const opened = await openGolds(page);
    const url = page.url();
    const name = await opened.getByRole("heading", { level: 2 }).textContent();
    const fresh = await page.context().newPage();
    await fresh.goto(url);
    const dialog = fresh.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
      name ?? "",
    );
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await expect(fresh).toHaveURL(/\/stats\?season=2024$/);
  });

  test("an unknown flight in the URL opens nothing", async ({ page }) => {
    await page.goto("/stats?season=2024&flight=nope");
    await expect(page.getByRole("heading", { name: /Stats/ })).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test("a collapsed best day expands from anywhere on its row", async ({
  page,
}) => {
  await page.goto("/stats?season=2024");
  const day = region(page, "Best days").locator("tbody tr").first();
  const expand = day.getByRole("button", { name: "All flights on Sun 28 Jul" });
  // The top flight's distance: on a collapsed day, it expands the day
  // rather than opening that flight.
  await day.getByRole("cell").nth(3).getByRole("listitem").first().click();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("dialog")).toBeHidden();
  // Expanded, the same line opens its flight.
  await day.getByRole("cell").nth(3).getByRole("listitem").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(expand).toHaveAttribute("aria-expanded", "true");
});

test.describe("expanded rows survive Back", () => {
  test("from a trophy linked in the pop-up", async ({ page }) => {
    await page.goto("/stats?season=2024");
    const task = region(page, "Top tasks").getByRole("button", {
      name: /^Flights of /,
    });
    await task.first().click();
    const glider = region(page, "Club gliders").getByRole("button", {
      name: /^Flights in /,
    });
    await glider.first().click();
    const dialog = await openGolds(page);
    await dialog
      .getByRole("list", { name: "Trophies" })
      .getByRole("link", { name: "Pot Pewter Pringle" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Pot Pewter Pringle" }),
    ).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(task.first()).toHaveAttribute("aria-expanded", "true");
    await expect(glider.first()).toHaveAttribute("aria-expanded", "true");
  });

  test("from another page, and a fresh visit starts collapsed", async ({
    page,
  }) => {
    await page.goto("/stats?season=2024");
    const day = region(page, "Best days").getByRole("button", {
      name: "All flights on Sun 28 Jul",
    });
    await day.click();
    await page.getByRole("link", { name: "Club records" }).click();
    await expect(page).toHaveURL(/\/records/);
    await page.goBack();
    await expect(day).toHaveAttribute("aria-expanded", "true");
    // A reload keeps them; a new visit doesn't.
    const fresh = await page.context().newPage();
    await fresh.goto(page.url());
    await expect(
      region(fresh, "Best days").getByRole("button", {
        name: "All flights on Sun 28 Jul",
      }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("switching to all launch sites keeps them", async ({ page }) => {
    await page.goto("/stats?season=2024");
    const day = region(page, "Best days").getByRole("button", {
      name: "All flights on Sun 28 Jul",
    });
    await day.click();
    await page.getByLabel(/launches only/).click();
    await expect(page).toHaveURL(/site=all/);
    await expect(day).toHaveAttribute("aria-expanded", "true");
  });
});
