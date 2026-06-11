import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:7199",
    trace: "on-first-retry",
  },
  webServer: {
    command: "E2E_TEST=1 RAILS_ENV=test bin/dev",
    url: "http://localhost:7199",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
