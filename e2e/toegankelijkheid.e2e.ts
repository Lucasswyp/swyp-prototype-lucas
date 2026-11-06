import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./base";

// Geautomatiseerde toegankelijkheidscontrole (WCAG A en AA) op alle schermen die zonder inloggen
// te zien zijn. Dit vangt o.a. ontbrekende labels, te weinig contrast en geblokkeerd inzoomen.
const pages = [
  "/app",
  "/app/search",
  "/app/rewards",
  "/app/wallet",
  "/app/onboarding",
  "/get-started",
  "/get-started/user",
  "/business/login",
  "/business/signup",
  "/for-business",
  "/installeren",
  "/support",
  "/privacy",
  "/terms",
  "/voorwaarden-bedrijven",
];

test.describe("toegankelijkheid", () => {
  for (const path of pages) {
    test(`${path} heeft geen WCAG A/AA-overtredingen`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(path === "/app" ? 5_000 : 2_500);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const summary = result.violations.map((v) => `${v.id} (${v.nodes.length}x): ${v.nodes[0]?.target.join(" ")}`);
      expect(summary).toEqual([]);
    });
  }
});
