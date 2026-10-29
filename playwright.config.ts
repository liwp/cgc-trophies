import { defineConfig, devices } from "@playwright/test";

// The suite builds and serves this checkout on its own port and never reuses a
// running server: one on the dev port (3000) may be another worktree's dev
// server, whose code and hot reloads would make the tests pass or fail at
// random. A port already in use fails the run (strictPort) instead.
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `bun run build && bun run start --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
