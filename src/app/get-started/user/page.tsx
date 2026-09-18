"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function UserAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const res = await fetch("/api/auth/signup-consumer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Aanmelden is mislukt.");
        setLoading(false);
        return;
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(mode === "login" ? "Onjuist e-mailadres of wachtwoord." : "Inloggen na aanmelden is mislukt.");
      return;
    }
    router.replace("/app/onboarding");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.28),transparent_60%)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
                mode === "signup" ? "bg-white text-indigo" : "bg-white/5 text-white/60"
              }`}
            >
              Aanmelden
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
                mode === "login" ? "bg-white text-indigo" : "bg-white/5 text-white/60"
              }`}
            >
              Inloggen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium mb-1.5 text-white/60">Naam</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="Jouw naam"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">E-mailadres</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="jij@voorbeeld.nl"
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
              {loading ? "Bezig..." : mode === "signup" ? "Start met Swyp" : "Inloggen"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          <Link href="/get-started" className="hover:text-white/60">
            ← Ander pad kiezen
          </Link>
        </p>
      </div>
    </div>
  );
}
