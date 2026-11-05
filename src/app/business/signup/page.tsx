"use client";

import posthog from "posthog-js";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/businessCategories";
import { CAMPAIGN_PRICE_EUR } from "@/lib/businessTerms";
import type { Category } from "@/types";

export default function BusinessSignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordHintId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup-business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, companyName, category, location, acceptedTerms }),
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
    posthog.capture("signup_completed", { kind: "business" });
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
          <p className="text-sm text-white/60 mb-6">Een account is gratis. Je betaalt pas als je een campagne start.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="naam" className="block text-xs font-medium mb-1.5 text-white/70">Bedrijfsnaam</label>
              <input
                id="naam"
                required
                autoComplete="organization"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="Naam van je bedrijf"
              />
            </div>
            <div>
              <label htmlFor="cat" className="block text-xs font-medium mb-1.5 text-white/70">Wat voor bedrijf is het?</label>
              <select
                id="cat"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
              >
                <option value="" className="bg-slate">Kies wat het beste past</option>
                {BUSINESS_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value} className="bg-slate">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="plaats" className="block text-xs font-medium mb-1.5 text-white/70">Plaats</label>
              <input
                id="plaats"
                required
                autoComplete="address-level2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="bv. Haarlem"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5 text-white/70">E-mailadres</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                placeholder="jij@bedrijf.nl"
              />
            </div>
            <div>
              <label htmlFor="wachtwoord" className="block text-xs font-medium mb-1.5 text-white/70">Wachtwoord</label>
              <div className="relative">
                <input
                  id="wachtwoord"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-describedby={passwordHintId}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 pl-3 pr-16 py-2.5 text-sm outline-none focus:border-violet"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-xs font-medium text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                >
                  {showPassword ? "Verberg" : "Toon"}
                </button>
              </div>
              <p id={passwordHintId} className="mt-1 text-xs text-white/55">Minimaal 8 tekens.</p>
            </div>
            <label className="flex items-start gap-2.5 text-xs text-white/70 leading-relaxed">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-violet"
              />
              <span>
                Ik ga akkoord met de{" "}
                <Link href="/voorwaarden-bedrijven" target="_blank" className="underline text-white/80">
                  voorwaarden voor bedrijven
                </Link>{" "}
                en het <Link href="/privacy" target="_blank" className="underline text-white/80">privacybeleid</Link>.
              </span>
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <Button type="submit" fullWidth className="mt-2" disabled={loading}>
              {loading ? "Bezig..." : "Account aanmaken"}
            </Button>
            <p className="text-xs leading-relaxed text-white/55">
              Daarna kom je meteen in je dashboard, waar je je eerste video uploadt. We controleren elke video voordat hij live gaat.
              Een campagne kost €{CAMPAIGN_PRICE_EUR} per 30 dagen, exclusief btw. Je krijgt dan een factuur.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-white/55 mt-6 flex flex-col gap-2">
          <Link href="/business/login" className="hover:text-white">
            Al een account? Log in
          </Link>
          <Link href="/get-started" className="hover:text-white">
            ← Ander pad kiezen
          </Link>
        </p>
      </div>
    </div>
  );
}
