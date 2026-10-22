import { defineConfig, devices } from "@playwright/test";

// Standaard testen we tegen de live site (alleen lezen, zonder inloggen).
// Lokaal tegen je eigen server: E2E_BASE_URL=http://localhost:3000 npm run e2e
const baseURL = process.env.E2E_BASE_URL ?? "https://swyp.it";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobiel", use: { ...devices["Pixel 5"] } },
  ],
});
