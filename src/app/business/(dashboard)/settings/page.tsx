"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useBusiness } from "@/contexts/BusinessContext";
import { createClient } from "@/lib/supabase/client";
import { DeleteAccount } from "@/components/DeleteAccount";
import { uploadBusinessLogo } from "@/lib/imageUpload";

export default function BusinessSettingsPage() {
  const { business, email } = useBusiness();
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description);
  const [website, setWebsite] = useState(business.website);
  const [address, setAddress] = useState(business.location);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(business.logoUrl);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoBusy(true);
    setLogoError(null);
    try {
      const url = await uploadBusinessLogo(file);
      const { error } = await createClient().from("businesses").update({ logo_url: url }).eq("id", business.id);
      if (error) throw error;
      setLogoUrl(url);
      router.refresh();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Uploaden is mislukt. Probeer het opnieuw.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("businesses")
      .update({ name, description, website, location: address })
      .eq("id", business.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold mb-1">Instellingen</h1>
      <p className="text-white/50 text-sm mb-6">Bedrijfsprofiel en account.</p>

      <Card className="p-5 mb-4">
        <h2 className="font-heading font-bold text-sm mb-4">Bedrijfsprofiel</h2>
        <div className="flex items-center gap-4 mb-5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold">
              {business.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <input ref={fileInput} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={logoBusy}>
              {logoBusy ? "Bezig met uploaden..." : logoUrl ? "Foto wijzigen" : "Profielfoto toevoegen"}
            </Button>
            <p className="text-xs text-white/40 mt-1.5">Je logo of een foto van je zaak. Vierkant werkt het mooist.</p>
            {logoError && <p className="text-xs text-red-300 mt-1">{logoError}</p>}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Bedrijfsnaam</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Website</label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5 text-white/60">Omschrijving</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet" />
        </div>
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5 text-white/60">Adres</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet" />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Bezig..." : saved ? "Opgeslagen ✓" : "Wijzigingen opslaan"}
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-heading font-bold text-sm mb-4">Account</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Ingelogd als</span>
          <span className="font-semibold">{email}</span>
        </div>
      </Card>

      <div className="mt-4">
        <DeleteAccount kind="business" />
      </div>
    </div>
  );
}
