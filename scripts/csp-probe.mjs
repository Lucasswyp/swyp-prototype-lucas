// Opent de belangrijkste pagina's in een echte browser en meldt elke overtreding
// van de Content-Security-Policy. Gebruik: node scripts/csp-probe.mjs [basis-url]
import { chromium, devices } from "@playwright/test";

const base = process.argv[2] ?? "https://swyp.it";
const pages = ["/", "/for-business", "/get-started", "/get-started/user", "/business/login", "/business/signup", "/privacy", "/terms", "/voorwaarden-bedrijven", "/support", "/test", "/wachtwoord-vergeten",
  "/app", "/app/search", "/app/messages", "/app/rewards", "/app/saved", "/app/profile", "/app/wallet", "/admin/reports"];
const browser = await chromium.launch();
const violations = new Map();
for (const [name, device] of [["desktop", devices["Desktop Chrome"]], ["mobiel", devices["Pixel 5"]]]) {
  const ctx = await browser.newContext(device);
  for (const p of pages) {
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__v = [];
      document.addEventListener("securitypolicyviolation", (e) => window.__v.push({ d: e.effectiveDirective, b: e.blockedURI, disp: e.disposition }));
    });
    try {
      await page.goto(base + p, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(3000);
      for (const x of await page.evaluate(() => window.__v)) {
        const key = `${x.d} <- ${x.b} (${x.disp})`;
        const cur = violations.get(key) ?? { count: 0, pages: new Set() };
        cur.count++; cur.pages.add(`${name}:${p}`); violations.set(key, cur);
      }
    } catch (e) { console.log("fout bij", p, e.message.slice(0, 80)); }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(`Overtredingen (${violations.size} soorten):`);
for (const [k, v] of violations) console.log("-", k, `x${v.count}`, [...v.pages].slice(0, 3).join(", "));
if (violations.size === 0) console.log("Geen enkele overtreding gezien.");
