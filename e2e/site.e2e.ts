import { expect, test } from "@playwright/test";

// Controles voor wie niet is ingelogd. Ze veranderen niets in de database
// (behalve een paar anonieme weergaven in de statistieken).

test.describe("openbare pagina's", () => {
  test("landingspagina laadt met kop en deel-metadata", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Swyp/);
  });

  test("voorbeelddashboard voor bedrijven is gemarkeerd als fictief", async ({ page }) => {
    await page.goto("/for-business");
    await expect(page.getByText("Voorbeeld met fictieve cijfers")).toBeVisible();
  });

  for (const path of ["/privacy", "/terms", "/support", "/get-started", "/business/login", "/test"]) {
    test(`${path} laadt`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    });
  }

  test("onbekende pagina geeft een nette 404", async ({ page }) => {
    const res = await page.goto("/bestaat-niet-" + Date.now());
    expect(res?.status()).toBe(404);
  });
});

test.describe("technische bestanden en beveiliging", () => {
  test("robots.txt en sitemap.xml bestaan en wijzen goed", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Disallow: /app/");
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("universele-linkbestand is geldige JSON voor de Swyp-app", async ({ request }) => {
    const res = await request.get("/.well-known/apple-app-site-association");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/json");
    const body = await res.json();
    expect(body.applinks.details[0].appID).toBe("5YNP5PZ27W.it.swyp.app");
  });

  test("beveiligingsheaders staan aan", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy-report-only"]).toBeUndefined();
    expect(h["strict-transport-security"]).toBeTruthy();
  });

  test("gezondheidscheck meldt dat site en database draaien", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, db: true });
    expect(res.headers()["cache-control"]).toContain("no-store");
  });

  test("pushroute weigert wie niet is ingelogd", async ({ request }) => {
    const res = await request.post("/api/push/message", { data: { messageId: "22222222-2222-2222-2222-222222222222" } });
    expect(res.status()).toBe(401);
  });

  test("meldingsroute voor beheerders weigert wie niet is ingelogd", async ({ request }) => {
    expect((await request.post("/api/reports/notify")).status()).toBe(401);
  });

  test("CSP-meldingen worden geaccepteerd", async ({ request }) => {
    const res = await request.post("/api/csp-report", { data: { "csp-report": { "violated-directive": "test" } } });
    expect(res.status()).toBe(204);
  });
});

test.describe("de app als gast", () => {
  // Een nieuwe browser telt als "eerste keer" en krijgt dan de lanceeranimatie;
  // de gewone tests doen alsof de app net nog open was.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem("__force_minutes_ago") === null) {
        localStorage.setItem("swyp-last-active", String(Date.now()));
      }
    });
  });

  test("feed laadt een video met bedrijf en productknop", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/app");
    await expect(page.getByText("Bekijk product").first()).toBeVisible({ timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  test("onderste navigatie heeft vijf tabbladen, inclusief Berichten en zonder Saved", async ({ page }) => {
    await page.goto("/app");
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav.getByRole("link")).toHaveCount(5);
    await expect(nav.getByRole("link", { name: /Saved|Opgeslagen/ })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: /Berichten/ })).toBeVisible();
  });

  test("de knoppen in de feed zijn standaard het glazen kapsel, en het klassieke ontwerp blijft te kiezen", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText("Bewaar", { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.goto("/app?knoppen=a");
    await expect(page.getByLabel("Opslaan")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Bewaar", { exact: true })).toHaveCount(0);
    await page.goto("/app"); // de keuze voor klassiek blijft staan
    await expect(page.getByText("Bewaar", { exact: true })).toHaveCount(0);
    await page.goto("/app?knoppen=b");
    await expect(page.getByText("Bewaar", { exact: true })).toBeVisible({ timeout: 20_000 });
  });

  test("het i-tje is weg uit de knoppen en 'Bekijk product' brengt een gast naar het product", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText("Bekijk product").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel("Meer info")).toHaveCount(0);
    // Een gast krijgt eerst een inlogvenster; wegklikken zoals een echte bezoeker.
    const later = page.getByText("Later, ik wil eerst kijken");
    await later.first().waitFor({ timeout: 8_000 }).then(() => later.first().click()).catch(() => {});
    await page.getByText("Bekijk product").first().click();
    await expect(page).toHaveURL(/\/app\/product\//, { timeout: 15_000 });
  });

  test("zoeken geeft zonder fout een antwoord", async ({ page }) => {
    await page.goto("/app/search");
    await page.getByPlaceholder("Zoek merken, producten, deals...").fill("pizza");
    // Resultaat of 'geen resultaten': allebei goed, een crash of eeuwig laden niet.
    await expect(page.getByText(/Geen resultaten voor|Video's|Producten|Bedrijven|Rewards/).first()).toBeVisible({ timeout: 15_000 });
  });

  test("het meldingenscherm is niet voor gasten", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.getByText(/Log in met je Swyp-account om meldingen af te handelen|geen adminrechten/).first()).toBeVisible({ timeout: 15_000 });
  });

  test("berichten vragen een gast om in te loggen", async ({ page }) => {
    await page.goto("/app/messages");
    await expect(page.getByText(/Welkom bij Swyp|Praat met je vrienden/).first()).toBeVisible({ timeout: 15_000 });
  });

  test("een gast wordt niet doorgestuurd naar andermans gesprek", async ({ page }) => {
    await page.goto("/app/messages/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/Log in om je berichten te lezen|Welkom bij Swyp|bestaat niet/).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("lanceeranimatie", () => {
  // Zet vóór het laden "laatst actief" op X minuten geleden en start een nieuwe sessie.
  async function startAfter(page: import("@playwright/test").Page, minutesAgo: number) {
    await page.addInitScript((m) => {
      if (!sessionStorage.getItem("__e2e_done")) {
        localStorage.setItem("swyp-last-active", String(Date.now() - m * 60_000));
        sessionStorage.clear();
        sessionStorage.setItem("__e2e_done", "1");
      }
    }, minutesAgo);
  }
  const splash = (page: import("@playwright/test").Page) => page.getByTestId("launch-splash");

  test("speelt na uren weg zijn, niet bij verversen, en is weg te tikken", async ({ page }) => {
    await startAfter(page, 5 * 60);
    await page.goto("/app");
    await expect(splash(page)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByAltText("Swyp").first()).toBeVisible();
    await splash(page).click();
    await expect(splash(page)).toHaveCount(0, { timeout: 5_000 });

    await page.reload();
    await page.waitForFunction(() => sessionStorage.getItem("swyp-splash-shown") === "1");
    await page.waitForTimeout(800);
    await expect(splash(page)).toHaveCount(0);
  });

  test("speelt niet als je de app net nog open had", async ({ page }) => {
    await startAfter(page, 10);
    await page.goto("/app");
    await page.waitForFunction(() => sessionStorage.getItem("swyp-splash-shown") === "1", null, { timeout: 15_000 });
    await page.waitForTimeout(800);
    await expect(splash(page)).toHaveCount(0);
  });
});
