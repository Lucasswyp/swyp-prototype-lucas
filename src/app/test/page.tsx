"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const STEPS = [
  "Aanmelden met e-mailadres",
  "10 video's bekeken",
  "2 video's geliket en 1 product opgeslagen",
  "Gezocht naar een bedrijf",
  "Wallet en een beloning bekeken",
  "Feedback geven geprobeerd (Profiel)",
  "Wachtwoord vergeten geprobeerd",
];

const FIELD =
  "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet";

export default function TestFormPage() {
  const [name, setName] = useState("");
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [stuck, setStuck] = useState("");
  const [unclear, setUnclear] = useState("");
  const [score, setScore] = useState("");
  const [wouldUse, setWouldUse] = useState("");
  const [why, setWhy] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = [
      `TESTER: ${name}`,
      `Gelukt: ${STEPS.filter((_, i) => done[i]).join("; ") || "niets aangevinkt"}`,
      `Niet gelukt: ${STEPS.filter((_, i) => !done[i]).join("; ") || "-"}`,
      `Vastgelopen: ${stuck || "-"}`,
      `Onduidelijk: ${unclear || "-"}`,
      `Cijfer: ${score || "-"}/10`,
      `Zou gebruiken: ${wouldUse || "-"}`,
      `Waarom: ${why || "-"}`,
    ]
      .join("\n")
      .slice(0, 2000);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "overig", message, page: "testformulier" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Versturen is mislukt.");
        return;
      }
      posthog.capture("test_form_sent", { score: Number(score) || null, wouldUse });
      setSent(true);
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full px-4 py-10 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.25),transparent_60%)]">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        {sent ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <h1 className="font-heading text-xl font-bold mb-2">Bedankt!</h1>
            <p className="text-sm text-white/60">Je antwoorden zijn binnen. Hier word Swyp beter van.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-5">
            <div>
              <h1 className="font-heading text-xl font-bold mb-1">Swyp testen</h1>
              <p className="text-sm text-white/50">Duurt ongeveer 3 minuten. Er zijn geen foute antwoorden.</p>
            </div>

            <div>
              <label htmlFor="t-name" className="block text-xs font-medium mb-1.5 text-white/60">
                Je voornaam
              </label>
              <input id="t-name" required value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
            </div>

            <fieldset>
              <legend className="block text-xs font-medium mb-2 text-white/60">Wat is je gelukt?</legend>
              <div className="flex flex-col gap-2">
                {STEPS.map((s, i) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!done[i]}
                      onChange={(e) => setDone((d) => ({ ...d, [i]: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="t-stuck" className="block text-xs font-medium mb-1.5 text-white/60">
                Waar bleef je hangen of liep je vast?
              </label>
              <textarea id="t-stuck" rows={3} value={stuck} onChange={(e) => setStuck(e.target.value)} className={FIELD} />
            </div>

            <div>
              <label htmlFor="t-unclear" className="block text-xs font-medium mb-1.5 text-white/60">
                Wat snapte je niet (bijvoorbeeld waarvoor je punten kreeg)?
              </label>
              <textarea id="t-unclear" rows={3} value={unclear} onChange={(e) => setUnclear(e.target.value)} className={FIELD} />
            </div>

            <div>
              <label htmlFor="t-score" className="block text-xs font-medium mb-1.5 text-white/60">
                Welk cijfer geef je Swyp (1 tot 10)?
              </label>
              <select id="t-score" value={score} onChange={(e) => setScore(e.target.value)} className={FIELD}>
                <option value="">Kies...</option>
                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="block text-xs font-medium mb-2 text-white/60">Zou je Swyp zelf gebruiken?</legend>
              <div className="flex gap-2">
                {["ja", "misschien", "nee"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setWouldUse(o)}
                    aria-pressed={wouldUse === o}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-medium capitalize ${
                      wouldUse === o ? "bg-white text-indigo" : "bg-white/5 text-white/60"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="t-why" className="block text-xs font-medium mb-1.5 text-white/60">
                Waarom wel of niet?
              </label>
              <textarea id="t-why" rows={2} value={why} onChange={(e) => setWhy(e.target.value)} className={FIELD} />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" fullWidth disabled={busy || name.trim().length === 0}>
              {busy ? "Bezig..." : "Versturen"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
