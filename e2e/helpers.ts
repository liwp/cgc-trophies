import type { Page } from "@playwright/test";
import flights from "./fixtures/flights.json";

/**
 * Intercept the app's flight-data request and reply with the committed
 * fixture, so E2E tests are deterministic and offline.
 */
export async function mockFlights(page: Page) {
  await page.route("**/api/flights*", (route) =>
    route.fulfill({ json: flights }),
  );
}
