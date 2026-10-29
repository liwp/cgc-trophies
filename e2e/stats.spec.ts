import { expect, type Page, test } from "@playwright/test";
import { mockFlights } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

const tile = (page: Page, label: string) =>
  page.getByRole("listitem").filter({ hasText: label });

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
