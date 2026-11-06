import { describe, expect, it, vi } from "vitest";
import { buildPendingDigest, readMailConfig, sendMail, type PendingAd } from "@/lib/pendingDigest";

const ad = (n: number): PendingAd => ({ id: `a${n}`, caption: `Video ${n}`, created_at: "2026-11-05T10:00:00Z", business: `Bedrijf ${n}` });

describe("buildPendingDigest", () => {
  it("maakt niets als er niets wacht", () => {
    expect(buildPendingDigest([], "https://swyp.it/admin/ads")).toBeNull();
  });

  it("noemt bedrijf, tekst en de link", () => {
    const d = buildPendingDigest([ad(1)], "https://swyp.it/admin/ads")!;
    expect(d.subject).toBe("1 video wacht op goedkeuring bij Swyp");
    expect(d.text).toContain("Bedrijf 1");
    expect(d.text).toContain("Video 1");
    expect(d.text).toContain("https://swyp.it/admin/ads");
  });

  it("kapt een lange lijst af en zegt hoeveel er nog meer zijn", () => {
    const d = buildPendingDigest(Array.from({ length: 25 }, (_, i) => ad(i)), "u")!;
    expect(d.subject).toBe("25 video's wachten op goedkeuring bij Swyp");
    expect(d.text).toContain("nog 5 andere");
  });

  it("verdraagt een ontbrekende tekst of bedrijfsnaam", () => {
    const d = buildPendingDigest([{ id: "x", caption: null, created_at: "2026-11-05T10:00:00Z", business: null }], "u")!;
    expect(d.text).toContain("Onbekend bedrijf");
    expect(d.text).toContain("(geen tekst)");
  });
});

describe("sendMail", () => {
  const mail = { subject: "s", text: "t" };

  it("doet niets zonder sleutel of ontvanger", async () => {
    const f = vi.fn();
    expect(await sendMail({ apiKey: undefined, to: "a@b.nl", from: "x" }, mail, f as unknown as typeof fetch)).toEqual({ sent: false, reason: "mail_not_configured" });
    expect(await sendMail({ apiKey: "k", to: undefined, from: "x" }, mail, f as unknown as typeof fetch)).toEqual({ sent: false, reason: "mail_not_configured" });
    expect(f).not.toHaveBeenCalled();
  });

  it("verstuurt met de sleutel in de kop, niet in de inhoud", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const r = await sendMail({ apiKey: "geheim", to: "a@b.nl", from: "Swyp <x@y.nl>" }, mail, f as unknown as typeof fetch);
    expect(r.sent).toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer geheim");
    expect(init.body).not.toContain("geheim");
  });

  it("meldt een fout van de maildienst", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    expect(await sendMail({ apiKey: "k", to: "a@b.nl", from: "x" }, mail, f as unknown as typeof fetch)).toEqual({ sent: false, reason: "mail_error_403" });
  });

  it("gebruikt de testafzender van de maildienst als er geen eigen is", () => {
    expect(readMailConfig({ RESEND_API_KEY: "k", ADMIN_NOTIFY_EMAIL: "a@b.nl" }).from).toBe("Swyp <onboarding@resend.dev>");
    expect(readMailConfig({ RESEND_FROM: "Swyp <hallo@swyp.it>" }).from).toBe("Swyp <hallo@swyp.it>");
  });
});
