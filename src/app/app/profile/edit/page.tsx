"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, X, Loader2 } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Button } from "@/components/ui/Button";
import {
  fetchMyProfile,
  updateProfile,
  uploadAvatar,
  validateUsernameFormat,
  isUsernameTaken,
  type ConsumerProfile,
} from "@/lib/profile";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ConsumerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">(
    "idle"
  );

  useEffect(() => {
    fetchMyProfile().then((p) => {
      if (p) {
        setProfile(p);
        setName(p.name);
        setUsername(p.username ?? "");
        setAvatarPreview(p.avatarUrl);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!username || username === profile?.username) {
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
  }, [username, profile?.username]);

  function handlePickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!profile) return;
    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      setError("Kies een geldige, beschikbare gebruikersnaam.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(profile.authUserId, avatarFile);
      }
      await updateProfile({
        name,
        username: username || undefined,
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      router.replace("/app/profile");
      router.refresh();
    } catch {
      setError("Opslaan is mislukt. Probeer het nogmaals.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full pb-28">
        <TopBar title="Profiel bewerken" back />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 px-4">
      <TopBar title="Profiel bewerken" back />

      <div className="flex flex-col items-center mt-4 mb-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-violet to-magenta flex items-center justify-center"
          aria-label="Profielfoto wijzigen"
        >
          {avatarPreview ? (
            // A locally chosen file's blob: URL and Supabase's public URL both
            // render fine as a plain img — next/image needs a fixed, known
            // remote host, which a freshly picked local file doesn't have.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-heading text-2xl font-extrabold">{name.charAt(0).toUpperCase()}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <Camera size={22} />
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickAvatar} className="hidden" />
        <p className="text-xs text-white/40 mt-2">Tik om je profielfoto te wijzigen</p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-white/60">Naam</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-violet"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-white/60">Gebruikersnaam</label>
          <div className="relative">
            <input
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
          {usernameStatus === "taken" && <p className="text-xs text-red-300 mt-1">Deze gebruikersnaam is al bezet.</p>}
          {usernameStatus === "invalid" && (
            <p className="text-xs text-red-300 mt-1">3-20 tekens: kleine letters, cijfers, underscores.</p>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button
          fullWidth
          className="mt-2"
          disabled={saving || usernameStatus === "taken" || usernameStatus === "invalid"}
          onClick={handleSave}
        >
          {saving ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>
    </div>
  );
}
