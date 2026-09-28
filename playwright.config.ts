/// Playwright config for E2E tests
/// Run: pnpm e2e

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : "html",
  // Bounded timeouts: a hanging wait must fail loudly, never wedge the job.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "pnpm preview",
    url: "http://localhost:4321",
    // CI boots the preview manually inside the E2E step (bounded readiness
    // loop + cleanup); local workflow does the same. Playwright must never
    // manage the server process itself on this repo.
    reuseExistingServer: true,
    timeout: 120000,
  },
});