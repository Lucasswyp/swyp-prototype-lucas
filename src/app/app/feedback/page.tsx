"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/consumer/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const KINDS = [
  { value: "bug", label: "Iets werkt niet" },
  { value: "idee", label: "Idee" },
  { value: "overig", label: "Anders" },
] as const;

function FeedbackForm() {
  const from = useSearchParams().get("from") ?? "";
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("bug");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message, page: from }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Versturen is mislukt.");
        return;
      }
      setDone(true);
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card className="p-5 text-center">
        <p className="font-heading font-bold text-lg mb-1">Bedankt!</p>
        <p className="text-sm text-white/60">Je feedback is binnen. Hier word je er beter van.</p>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex gap-2" role="radiogroup" aria-label="Soort feedback">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={kind === k.value}
            onClick={() => setKind(k.value)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-medium ${
              kind === k.value ? "bg-white text-indigo" : "bg-white/5 text-white/60"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="feedback-message" className="block text-xs font-medium mb-1.5 text-white/60">
          Wat wil je ons laten weten?
        </label>
        <textarea
          id="feedback-message"
          required
          minLength={3}
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Wat zag je, wat verwachtte je, en waar gebeurde het?"
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
        />
        <p className="text-right text-[11px] text-white/30 mt-1">{message.length}/2000</p>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button type="submit" fullWidth disabled={busy || message.trim().length < 3}>
        {busy ? "Bezig..." : "Versturen"}
      </Button>
    </form>
  );
}

export default function FeedbackPage() {
  return (
    <div className="min-h-full pb-28">
      <TopBar title="Feedback geven" back />
      <div className="px-4 pt-2">
        <Suspense>
          <FeedbackForm />
        </Suspense>
      </div>
    </div>
  );
}
