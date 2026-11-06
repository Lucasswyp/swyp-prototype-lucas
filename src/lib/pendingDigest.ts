// Een dagelijkse mail aan de beheerder als er video's wachten op goedkeuring. Zonder sleutel voor de
// maildienst doet dit niets (en meldt het dat netjes terug), zodat het veilig kan staan voordat de mail is ingericht.

export interface PendingAd {
  id: string;
  caption: string | null;
  created_at: string;
  business: string | null;
}

export function buildPendingDigest(ads: PendingAd[], adminUrl: string): { subject: string; text: string } | null {
  if (ads.length === 0) return null;
  const lines = ads.slice(0, 20).map((a) => {
    const when = new Date(a.created_at).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const caption = (a.caption ?? "").trim().slice(0, 80) || "(geen tekst)";
    return `- ${a.business ?? "Onbekend bedrijf"}: "${caption}" (${when})`;
  });
  const more = ads.length > 20 ? `\n... en nog ${ads.length - 20} andere.` : "";
  return {
    subject: ads.length === 1 ? "1 video wacht op goedkeuring bij Swyp" : `${ads.length} video's wachten op goedkeuring bij Swyp`,
    text: `Er wachten video's op jouw goedkeuring:\n\n${lines.join("\n")}${more}\n\nBekijk en keur goed: ${adminUrl}\n\nBedrijven zien hun video pas in de feed na jouw goedkeuring.`,
  };
}

export interface MailConfig {
  apiKey: string | undefined;
  to: string | undefined;
  from: string | undefined;
}

export function readMailConfig(env: Record<string, string | undefined>): MailConfig {
  return { apiKey: env.RESEND_API_KEY, to: env.ADMIN_NOTIFY_EMAIL, from: env.RESEND_FROM || "Swyp <onboarding@resend.dev>" };
}

export async function sendMail(
  cfg: MailConfig,
  mail: { subject: string; text: string },
  fetchImpl: typeof fetch = fetch
): Promise<{ sent: boolean; reason?: string }> {
  if (!cfg.apiKey || !cfg.to) return { sent: false, reason: "mail_not_configured" };
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: cfg.from, to: [cfg.to], subject: mail.subject, text: mail.text }),
  });
  if (!res.ok) return { sent: false, reason: `mail_error_${res.status}` };
  return { sent: true };
}
