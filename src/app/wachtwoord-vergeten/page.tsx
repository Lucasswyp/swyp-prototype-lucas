"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/wachtwoord-resetten`,
    });
    setLoading(false);
    if (resetError) {
      setError("Versturen is mislukt. Probeer het over een paar minuten opnieuw.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.25),transparent_60%)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="font-heading text-lg font-bold mb-1">Wachtwoord vergeten</h1>
          {sent ? (
            <p className="text-sm text-white/60">
              Als er een account bestaat voor <strong className="text-white">{email}</strong>, hebben we een link
              gestuurd om een nieuw wachtwoord te kiezen. Check ook je spam.
            </p>
          ) : (
            <>
              <p className="text-sm text-white/50 mb-6">Vul je e-mailadres in, dan sturen we je een link.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-medium mb-1.5 text-white/60">
                    E-mailadres
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                  />
                </div>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? "Bezig..." : "Stuur link"}
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-white/30 mt-6">
          <Link href="/get-started" className="hover:text-white/60">
            ← Terug naar inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}
