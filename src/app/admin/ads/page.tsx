"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/googleAuth";
import { useHlsSource } from "@/lib/useHlsSource";

interface PendingAd {
  id: string;
  video_url: string;
  poster_url: string | null;
  caption: string | null;
  category: string | null;
  cta_label: string | null;
  business_name: string;
  product_name: string;
  created_at: string;
}

function ReviewVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { needsHlsJs } = useHlsSource(ref, src, true);
  return (
    <video
      ref={ref}
      src={needsHlsJs ? undefined : src}
      poster={poster}
      className="w-28 h-48 object-cover rounded-xl bg-black shrink-0"
      muted
      playsInline
      controls
    />
  );
}

type Status = "checking" | "signed-out" | "not-admin" | "ready";

// Deliberately not linked from anywhere in the app's own nav — this is a
// standalone review queue for the one or two people moderating new
// campaigns before they reach the consumer feed (see supabase/moderation.sql).
// Gated server-side by the `is_admin()` check inside the RPCs themselves,
// not by anything client-side, so there's nothing to bypass here.
export default function AdminAdsPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [ads, setAds] = useState<PendingAd[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus("signed-out");
      return;
    }
    setEmail(userData.user.email ?? null);
    const { data, error } = await supabase.rpc("get_pending_ads");
    if (error) {
      setStatus("not-admin");
      return;
    }
    setAds(data ?? []);
    setStatus("ready");
  }, []);

  useEffect(() => {
    // Initial data load on mount — an external fetch, not a derived value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function decide(adId: string, decision: "approved" | "rejected") {
    setBusyId(adId);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_ad_moderation_status", {
      p_ad_id: adId,
      p_status: decision,
    });
    setBusyId(null);
    if (!error) {
      setAds((prev) => prev.filter((a) => a.id !== adId));
      // Fire-and-forget — the daily cron (Hobby plan's cron ceiling) would
      // otherwise leave this decision invisible to search for up to 24h.
      // The route re-checks is_admin() itself rather than trusting this call.
      fetch("/api/algolia/reindex").catch(() => {});
    }
  }

  if (status === "checking") {
    return <div className="min-h-screen bg-indigo text-white p-8 text-sm text-white/50">Laden...</div>;
  }

  if (status === "signed-out") {
    return (
      <div className="min-h-screen bg-indigo text-white flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-white/60">Log in met je Swyp-account om campagnes te beoordelen.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="rounded-xl bg-white text-indigo font-semibold text-sm px-5 py-3"
        >
          Doorgaan met Google
        </button>
      </div>
    );
  }

  if (status === "not-admin") {
    return (
      <div className="min-h-screen bg-indigo text-white flex flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm text-white/60">
          {email ? `Ingelogd als ${email}, maar dit account heeft geen adminrechten.` : "Geen adminrechten."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo text-white p-6 max-w-2xl mx-auto">
      <nav className="mb-4 flex gap-4 text-sm text-white/50">
        <span className="font-semibold text-white">Advertenties</span>
        <Link href="/admin/reports" className="hover:text-white">Meldingen</Link>
      </nav>
      <h1 className="font-heading text-xl font-bold mb-1">Advertenties beoordelen</h1>
      <p className="text-sm text-white/50 mb-6">
        Nieuwe campagnes staan hier tot ze goed- of afgekeurd zijn — pas daarna verschijnen ze in de feed.
      </p>

      {ads.length === 0 ? (
        <p className="text-sm text-white/40">Niets om te beoordelen.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {ads.map((ad) => (
            <div key={ad.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex gap-4">
              <ReviewVideo src={ad.video_url} poster={ad.poster_url ?? undefined} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{ad.business_name}</p>
                <p className="text-xs text-white/50 mb-1">{ad.product_name}</p>
                {ad.caption && <p className="text-sm mb-2 line-clamp-3">{ad.caption}</p>}
                {ad.category && (
                  <p className="text-xs text-white/40 mb-3">
                    {ad.category} · {new Date(ad.created_at).toLocaleDateString("nl-NL")}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={busyId === ad.id}
                    onClick={() => decide(ad.id, "approved")}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {busyId === ad.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Goedkeuren
                  </button>
                  <button
                    disabled={busyId === ad.id}
                    onClick={() => decide(ad.id, "rejected")}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    <X size={14} />
                    Afkeuren
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
