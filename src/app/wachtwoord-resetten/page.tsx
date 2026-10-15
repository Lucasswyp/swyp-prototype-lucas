"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }
    if (password !== repeat) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError("Wijzigen is mislukt. De link is mogelijk verlopen; vraag een nieuwe aan.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.25),transparent_60%)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="font-heading text-lg font-bold mb-1">Nieuw wachtwoord</h1>
          {done ? (
            <>
              <p className="text-sm text-white/60 mb-4">Je wachtwoord is gewijzigd.</p>
              <Link href="/app" className="text-sm text-violet-300 underline">
                Verder naar Swyp
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
              <div>
                <label htmlFor="new-password" className="block text-xs font-medium mb-1.5 text-white/60">
                  Nieuw wachtwoord
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                />
              </div>
              <div>
                <label htmlFor="repeat-password" className="block text-xs font-medium mb-1.5 text-white/60">
                  Herhaal wachtwoord
                </label>
                <input
                  id="repeat-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                />
              </div>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Bezig..." : "Wachtwoord opslaan"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
