"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { validateUsernameFormat, isUsernameTaken } from "@/lib/profile";

const GENDERS = ["Man", "Vrouw", "Non-binair", "Zeg ik liever niet"];
const ETHNICITIES = [
  "Nederlands",
  "Europees",
  "Midden-Oosters",
  "Noord-Afrikaans",
  "Sub-Sahara Afrikaans",
  "Zuid-Aziatisch",
  "Oost-Aziatisch",
  "Zuidoost-Aziatisch",
  "Latijns-Amerikaans",
  "Anders",
  "Zeg ik liever niet",
];

export default function UserAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [checkEmail, setCheckEmail] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">(
    "idle"
  );

  useEffect(() => {
    if (mode !== "signup" || !username) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsernameStatus("idle");
      return;
    }
    const formatError = validateUsernameFormat(username);
    if (formatError) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const taken = await isUsernameTaken(username);
        if (!cancelled) setUsernameStatus(taken ? "taken" : "available");
      } catch {
        if (!cancelled) setUsernameStatus("idle");
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [username, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && (usernameStatus === "taken" || usernameStatus === "invalid")) {
      setError("Kies een geldige, beschikbare gebruikersnaam.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: { name, username, gender, birthdate, ethnicity },
        },
      });
      setLoading(false);
      if (signUpError) {
        const isDuplicateUsername = signUpError.message.toLowerCase().includes("username");
        setError(
          signUpError.message.includes("already registered")
            ? "Er bestaat al een account met dit e-mailadres."
            : isDuplicateUsername
              ? "Deze gebruikersnaam is zojuist door iemand anders gepakt — kies een andere."
              : "Aanmelden is mislukt."
        );
        return;
      }
      setCheckEmail(true);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Onjuist e-mailadres of wachtwoord.");
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.28),transparent_60%)]">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h1 className="font-heading font-bold text-lg mb-2">Check je e-mail</h1>
            <p className="text-sm text-white/60">
              We hebben een bevestigingslink gestuurd naar <strong className="text-white">{email}</strong>. Klik erop
              om je account te activeren en in te loggen.
            </p>
          </div>
        </div>
      </div>
    );
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

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-lg bg-white text-indigo font-semibold text-sm py-2.5 hover:brightness-95"
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C33.9 5.4 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13.5 24 13.5c3.1 0 5.8 1.1 8 3l6-6C33.9 6.4 29.2 4.5 24 4.5c-7.5 0-14 4.1-17.7 10.2z" />
              <path fill="#4CAF50" d="M24 44.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.8 40.3 16.4 44.5 24 44.5z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.1c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.4-.3-3.5z" />
            </svg>
            Ga verder met Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/30 uppercase tracking-wide">of met e-mail</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <>
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
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Gebruikersnaam</label>
                  <div className="relative">
                    <input
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 pr-8 text-sm outline-none focus:border-violet"
                      placeholder="jouwnaam"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 size={15} className="animate-spin text-white/40" />}
                      {usernameStatus === "available" && <Check size={15} className="text-emerald-400" />}
                      {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                        <X size={15} className="text-red-400" />
                      )}
                    </span>
                  </div>
                  {usernameStatus === "taken" && (
                    <p className="text-xs text-red-300 mt-1">Deze gebruikersnaam is al bezet.</p>
                  )}
                  {usernameStatus === "invalid" && (
                    <p className="text-xs text-red-300 mt-1">3-20 tekens: kleine letters, cijfers, underscores.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-white/60">Geslacht</label>
                    <select
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                    >
                      <option value="" disabled>
                        Kies...
                      </option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-white/60">Geboortedatum</label>
                    <input
                      required
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white/60">Achtergrond</label>
                  <select
                    required
                    value={ethnicity}
                    onChange={(e) => setEthnicity(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
                  >
                    <option value="" disabled>
                      Kies...
                    </option>
                    {ETHNICITIES.map((eth) => (
                      <option key={eth} value={eth}>
                        {eth}
                      </option>
                    ))}
                  </select>
                </div>
              </>
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
            <Button
              type="submit"
              fullWidth
              className="mt-2"
              disabled={
                loading || (mode === "signup" && (usernameStatus === "taken" || usernameStatus === "invalid"))
              }
            >
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
