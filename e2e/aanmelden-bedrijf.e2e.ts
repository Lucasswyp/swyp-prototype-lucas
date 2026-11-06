import { test, expect } from "./base";

// Het aanmeldformulier voor bedrijven, zonder dat er echt een account wordt aangemaakt: het verzoek
// naar de server wordt in de pagina zelf onderschept.
test.describe("aanmelden als bedrijf", () => {
  test("controleert de velden en stuurt de gekozen categorie mee", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __sent: unknown }).__sent = null;
      const orig = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : (input as Request).url;
        if (url.includes("/api/auth/signup-business")) {
          (window as unknown as { __sent: unknown }).__sent = JSON.parse(String(init?.body));
          return new Response(JSON.stringify({ error: "TESTBLOK" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        return orig(input, init);
      };
    });
    await page.goto("/business/signup", { waitUntil: "networkidle" });
    const sent = () => page.evaluate(() => (window as unknown as { __sent: unknown }).__sent);

    await page.getByRole("button", { name: "Account aanmaken" }).click();
    expect(await sent()).toBeNull(); // leeg formulier wordt geblokkeerd

    await page.getByLabel("Bedrijfsnaam").fill("Test Kapper");
    await page.getByLabel("Wat voor bedrijf is het?").selectOption({ label: "Kapper, barbershop, salon en beauty" });
    await page.getByLabel("Plaats").fill("Haarlem");
    await page.getByLabel("E-mailadres").fill("test@example.com");
    await page.getByLabel("Wachtwoord").fill("kort");
    await page.getByRole("button", { name: "Account aanmaken" }).click();
    expect(await sent()).toBeNull(); // te kort wachtwoord

    await page.getByLabel("Wachtwoord").fill("langgenoeg1");
    await page.getByRole("button", { name: "Account aanmaken" }).click();
    expect(await sent()).toBeNull(); // voorwaarden niet aangevinkt

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Account aanmaken" }).click();
    await expect(page.getByText("TESTBLOK")).toBeVisible();
    expect(await sent()).toMatchObject({ category: "Beauty", location: "Haarlem", companyName: "Test Kapper", acceptedTerms: true });
  });

  test("het wachtwoord is te tonen en te verbergen", async ({ page }) => {
    await page.goto("/business/signup", { waitUntil: "networkidle" });
    const field = page.getByLabel("Wachtwoord");
    await expect(field).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Toon" }).click();
    await expect(field).toHaveAttribute("type", "text");
  });
});
