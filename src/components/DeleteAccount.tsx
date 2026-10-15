"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function DeleteAccount({ kind }: { kind: "consumer" | "business" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Verwijderen is mislukt.");
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
      setBusy(false);
    }
  }

  return (
    <Card className="p-4 mb-4">
      <p className="text-sm font-bold mb-1">Account verwijderen</p>
      <p className="text-xs text-white/50 mb-3">
        {kind === "business"
          ? "Je bedrijfsprofiel, producten, campagnes, advertenties, video's en beloningen worden permanent verwijderd."
          : "Je profiel, tegoed, opgeslagen producten en gevolgde bedrijven worden permanent verwijderd."}{" "}
        Dit kan niet ongedaan worden gemaakt.
      </p>
      {!open ? (
        <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
          Account verwijderen
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="delete-confirm" className="text-xs text-white/60">
            Typ VERWIJDER om te bevestigen
          </label>
          <input
            id="delete-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoCapitalize="characters"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
          />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="danger" disabled={busy || confirm !== "VERWIJDER"} onClick={handleDelete}>
              {busy ? "Bezig..." : "Definitief verwijderen"}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setOpen(false); setConfirm(""); setError(null); }}>
              Annuleren
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
