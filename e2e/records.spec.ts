import { expect, type Page, test } from "@playwright/test";
import { mockFlights } from "./helpers";

const PHONE = { width: 360, height: 740 };
// A touch phone, which can't hover, so a tap is the only way to see a tooltip.
const TOUCH_PHONE = { viewport: PHONE, hasTouch: true, isMobile: true };

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

/** The visible table row or card for a task code. */
const recordFor = (page: Page, code: string) =>
  page
    .locator("tr:visible, li:visible")
    .filter({ has: page.getByText(code, { exact: true }) })
    .first();

const fitsViewport = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

test("the records page shows the four groups", async ({ page }) => {
  await page.goto("/records");

  await expect(
    page.getByRole("heading", { name: "CGC Club Records" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Distance",
    "Triangles",
    "Out-and-returns",
    "Height",
  ]);
});

test("a category without a record shows No claim", async ({ page }) => {
  await page.goto("/records");
  const row = recordFor(page, "600km O/R");
  await expect(row).toContainText("No claim");
  await expect(row.getByRole("button", { name: /earlier/ })).toHaveCount(0);
});

test("a route shows turnpoint codes on one line", async ({ page }) => {
  await page.goto("/records");
  await expect(recordFor(page, "600km △")).toContainText("TAL – BLW", {
    useInnerText: true,
  });
});

test("a route's tooltip names its turnpoints", async ({ page }) => {
  await page.goto("/records");
  const row = recordFor(page, "500km △");
  await expect(row).toContainText("BIC ’26");
  await expect(
    row.getByRole("button", {
      name: "Bicester Control Tower (removed 2026) – Scunthorpe N – Garboldisham",
    }),
  ).toBeVisible();
});

test("a UK record shows its lists in a tooltip", async ({ page }) => {
  await page.goto("/records");
  await expect(
    recordFor(page, "500km O/R").getByRole("button", {
      name: "Current UK record: UK Standard, UK Feminine Open",
    }),
  ).toBeVisible();
});

test("a record links to its BGA Ladder flight", async ({ page }) => {
  await page.goto("/records");
  await expect(
    recordFor(page, "100km O/R").getByRole("link", { name: /km\/h/ }),
  ).toHaveAttribute("href", "https://www.bgaladder.net/flightdetails/53036");
});

test("expanding a row shows its history", async ({ page }) => {
  await page.goto("/records");
  await recordFor(page, "200km O/R")
    .getByRole("button", { name: "Show earlier records" })
    .click();
  const history = page.getByRole("list", { name: "Earlier 200km O/R records" });
  await expect(history.getByRole("listitem")).toHaveCount(3);
  await expect(history.getByRole("listitem").first()).toContainText(
    "31/08/2013",
  );
});

test("history links only entries with a ladder flight", async ({ page }) => {
  await page.goto("/records");
  await recordFor(page, "200km O/R")
    .getByRole("button", { name: "Show earlier records" })
    .click();
  const entries = page
    .getByRole("list", { name: "Earlier 200km O/R records" })
    .getByRole("listitem");
  await expect(
    entries.filter({ hasText: "31/08/2013" }).getByRole("link"),
  ).toHaveAttribute("href", "https://www.bgaladder.net/flightdetails/44883");
  await expect(
    entries.filter({ hasText: "19/08/1996" }).getByRole("link"),
  ).toHaveCount(0);
});

test.describe("on a touch phone", () => {
  test.use(TOUCH_PHONE);

  test("a tap shows and hides a tooltip", async ({ page }) => {
    await page.goto("/records");
    const code = page.getByRole("button", { name: "Fastest 600 km triangle" });
    const tip = page.getByRole("tooltip", { name: "Fastest 600 km triangle" });
    await code.tap();
    await expect(tip).toBeVisible();
    await code.tap();
    await expect(tip).toBeHidden();
  });
});

test("the phone layout fits the viewport", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto("/records");
  await expect(page.locator("table:visible")).toHaveCount(0);
  await expect(page.locator("li:visible").first()).toBeVisible();
  expect(await fitsViewport(page)).toBe(true);
});

test("the desktop layout fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/records");
  await expect(page.locator("table:visible")).toHaveCount(4);
  expect(await fitsViewport(page)).toBe(true);
});

test("the home page links to the records page", async ({ page }) => {
  await page.goto("/?season=2024");
  await page.getByRole("link", { name: "Club records" }).click();
  await expect(page).toHaveURL(/\/records$/);
});

test("the records page loads with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/records");
  await page.waitForLoadState("networkidle");

  // Ignore the missing-favicon 404, which is unrelated to the app.
  const appErrors = errors.filter((e) => !e.includes("favicon"));
  expect(appErrors).toEqual([]);
});
