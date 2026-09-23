"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { validateUsernameFormat, isUsernameTaken } from "@/lib/profile";
import { signInWithGoogle } from "@/lib/googleAuth";
import { signInWithApple } from "@/lib/appleAuth";
import { isOldEnough, MIN_AGE } from "@/lib/age";

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
  const [signingInApple, setSigningInApple] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => setIsNative(Capacitor.isNativePlatform()));
  }, []);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("authError");
    if (authError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(`Inloggen met Google is mislukt: ${authError}`);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

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

    if (mode === "signup" && (!birthdate || !isOldEnough(birthdate))) {
      setError(`Je moet minimaal ${MIN_AGE} jaar oud zijn om Swyp te gebruiken.`);
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
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      // Only reached if signInWithGoogle returned without navigating away —
      // a successful native flow navigates off this screen before this runs.
      setLoading(false);
    }
  }

  async function handleApple() {
    if (signingInApple) return;
    setSigningInApple(true);
    try {
      await signInWithApple();
      router.replace("/app");
      router.refresh();
    } catch {
      setSigningInApple(false);
    }
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
            disabled={loading}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-lg bg-white text-indigo font-semibold text-sm py-2.5 hover:brightness-95 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C33.9 5.4 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13.5 24 13.5c3.1 0 5.8 1.1 8 3l6-6C33.9 6.4 29.2 4.5 24 4.5c-7.5 0-14 4.1-17.7 10.2z" />
                <path fill="#4CAF50" d="M24 44.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.8 40.3 16.4 44.5 24 44.5z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.1c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.4-.3-3.5z" />
              </svg>
            )}
            Ga verder met Google
          </button>
          {isNative && (
            <button
              type="button"
              onClick={handleApple}
              disabled={signingInApple}
              className="w-full mb-4 flex items-center justify-center gap-2 rounded-lg bg-black border border-white/15 text-white font-semibold text-sm py-2.5 hover:brightness-125 disabled:opacity-60"
            >
              {signingInApple ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
              )}
              Ga verder met Apple
            </button>
          )}
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
