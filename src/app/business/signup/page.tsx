"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

const categories: Category[] = [
  "Fashion",
  "Food",
  "Tech",
  "Fitness",
  "Travel",
  "Beauty",
  "Events",
  "Days Out",
  "Restaurants",
];

export default function BusinessSignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState<Category>("Fashion");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup-business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, companyName, category, location }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Aanmelden is mislukt.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Inloggen na aanmelden is mislukt.");
      return;
    }
    router.replace("/business");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.28),transparent_60%)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="font-heading text-lg font-bold mb-1">Meld je bedrijf aan</h1>
          <p className="text-sm text-white/50 mb-6">Maak een gratis Swyp Business account.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Bedrijfsnaam</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="bv. NØRR"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-white/60">Categorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-slate">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-white/60">Locatie</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="Amsterdam"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">E-mailadres</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="jij@bedrijf.nl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Wachtwoord</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" fullWidth className="mt-2" disabled={loading}>
              {loading ? "Bezig..." : "Account aanmaken"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6 flex flex-col gap-1.5">
          <Link href="/business/login" className="hover:text-white/60">
            Al een account? Log in
          </Link>
          <Link href="/get-started" className="hover:text-white/60">
            ← Ander pad kiezen
          </Link>
        </p>
      </div>
    </div>
  );
}
