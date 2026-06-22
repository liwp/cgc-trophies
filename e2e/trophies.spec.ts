import { expect, test } from "@playwright/test";
import { mockFlights } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockFlights(page);
});

test("homepage shows the season's winners and stats", async ({ page }) => {
  await page.goto("/?season=2024");

  await expect(
    page.getByRole("heading", { name: "CGC 2024 Trophies" }),
  ).toBeVisible();

  // Season stat card (ALL FLIGHTS = 273 / 368 attempts for 2024).
  await expect(page.getByText("368 attempts")).toBeVisible();

  // A known ladder-trophy winner for 2024.
  const row = page.locator("tr", { hasText: "Pot Pewter Pringle" });
  await expect(row).toContainText("Alex Holswilder");
  await expect(row).toContainText("18682");
});

test("a trophy detail page renders its scored flights", async ({ page }) => {
  await page.goto("/?season=2023");
  await page.getByRole("link", { name: "Mug Metal Machin Trophy" }).click();

  await expect(
    page.getByRole("heading", { name: "Mug Metal Machin Trophy" }),
  ).toBeVisible();

  // 2023 winner of this distance trophy.
  const table = page.locator("table");
  await expect(table).toContainText("Mark Lawrence-jones");
  await expect(table).toContainText("465.9");
});

test("switching season updates the results", async ({ page }) => {
  await page.goto("/?season=2024");
  await expect(
    page.locator("tr", { hasText: "Pot Pewter Pringle" }),
  ).toContainText("Alex Holswilder");

  await page.getByRole("button", { name: "Previous season" }).click();

  await expect(page).toHaveURL(/season=2023/);
  await expect(
    page.locator("tr", { hasText: "Pot Pewter Pringle" }),
  ).toContainText("Robert Theil");
});

test("an unknown trophy id is handled gracefully", async ({ page }) => {
  await page.goto("/trophy/999?season=2024");
  await expect(page.getByText("Unknown trophy: 999")).toBeVisible();
});

test("the homepage loads with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/?season=2024");
  await page.waitForLoadState("networkidle");

  // Ignore the missing-favicon 404, which is unrelated to the app.
  const appErrors = errors.filter((e) => !e.includes("favicon"));
  expect(appErrors).toEqual([]);
});
