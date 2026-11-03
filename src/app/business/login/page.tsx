"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function BusinessLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      setError("Onjuist e-mailadres of wachtwoord.");
      return;
    }
    // Een gewoon Swyp-account (kijker of beheerder) heeft geen bedrijf: dan stuurt het
    // dashboard je terug naar deze pagina zonder uitleg. Zeg het hier, en log uit zodat
    // je meteen met het adres van je bedrijf kunt proberen.
    const { data: business } = await supabase.from("businesses").select("id").eq("auth_user_id", data.user.id).maybeSingle();
    if (!business) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Dit e-mailadres heeft geen bedrijfsaccount. Log in met het adres waarmee je je bedrijf hebt aangemeld.");
      return;
    }
    router.replace("/business");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.25),transparent_60%)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="font-heading text-lg font-bold mb-1">Swyp for Business</h1>
          <p className="text-sm text-white/50 mb-6">Log in met je bedrijfsaccount.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">E-mailadres</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="jouw@bedrijf.nl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Wachtwoord</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" fullWidth className="mt-2" disabled={loading}>
              {loading ? "Bezig..." : "Inloggen"}
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-white/30 mt-6 flex flex-col gap-1.5">
          <Link href="/wachtwoord-vergeten" className="hover:text-white/60">
            Wachtwoord vergeten?
          </Link>
          <Link href="/business/signup" className="hover:text-white/60">
            Nog geen account? Meld je bedrijf aan
          </Link>
          <Link href="/get-started" className="hover:text-white/60">
            ← Ander pad kiezen
          </Link>
        </p>
      </div>
    </div>
  );
}
