import { expect, test } from "@playwright/test";
import { mockFlights } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

test("the records page lists every category", async ({ page }) => {
  await page.goto("/records");

  await expect(
    page.getByRole("heading", { name: "CGC Club Records" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(17);
});

test("a category without a record shows No claim", async ({ page }) => {
  await page.goto("/records");
  await expect(
    page.locator("tr", { hasText: "Fastest 600 km O/R" }),
  ).toContainText("No claim");
});

test("a UK record is shown with its list", async ({ page }) => {
  await page.goto("/records");
  const row = page.locator("tr", { hasText: "Fastest 500 km O/R" });
  await expect(row).toContainText("106.89 km/h");
  await expect(row).toContainText("UK Standard");
});

test("a record links to its BGA Ladder flight", async ({ page }) => {
  await page.goto("/records");
  const row = page.locator("tr", { hasText: "Fastest 100 km O/R" });
  await expect(row.getByRole("link")).toHaveAttribute(
    "href",
    "https://www.bgaladder.net/flightdetails/53036",
  );
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
