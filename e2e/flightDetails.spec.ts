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
