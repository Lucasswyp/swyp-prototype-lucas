"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquare, Heart, Bookmark, Share2, Info, MoreVertical } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteAccount } from "@/components/DeleteAccount";
import { useFeedButtonStyle, type FeedButtonStyle } from "@/lib/feedButtonStyle";

type PushStatus = "not-native" | "checking" | "granted" | "denied" | "prompt" | "prompt-with-rationale";

function StylePreview({ kind }: { kind: FeedButtonStyle }) {
  if (kind === "a") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        {[Heart, Bookmark, Share2, Info, MoreVertical].map((Icon, i) => (
          <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            <Icon size={12} />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/20 bg-white/10 px-1.5 py-1.5">
      {[Heart, Bookmark, Share2, Info, MoreVertical].map((Icon, i) => (
        <span key={i} className="flex flex-col items-center">
          <Icon size={14} />
          <span className="h-0.5 w-3 rounded bg-white/40" />
        </span>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [feedStyle, setFeedStyle] = useFeedButtonStyle();
  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");

  useEffect(() => {
    let cancelled = false;
    import("@capacitor/core").then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) {
        if (!cancelled) setPushStatus("not-native");
        return;
      }
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const perm = await PushNotifications.checkPermissions();
      if (!cancelled) setPushStatus(perm.receive as PushStatus);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnablePush() {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    setPushStatus(perm.receive as PushStatus);
    if (perm.receive === "granted") await PushNotifications.register();
  }

  return (
    <div className="min-h-full pb-28">
      <TopBar title="Instellingen" back />

      <div className="px-4 pt-2">
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5">
              <Bell size={18} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Pushmeldingen</p>
              <p className="text-xs text-white/50">Herinneringen als je streak dreigt te verlopen</p>
            </div>
          </div>

          {pushStatus === "not-native" && (
            <p className="text-xs text-white/40">
              Pushmeldingen werken alleen in de Swyp-app, niet in de browser.
            </p>
          )}
          {pushStatus === "checking" && <p className="text-xs text-white/40">Status controleren...</p>}
          {pushStatus === "granted" && (
            <p className="text-xs text-emerald-300">Aan — je ontvangt streak-herinneringen.</p>
          )}
          {(pushStatus === "prompt" || pushStatus === "prompt-with-rationale" || pushStatus === "denied") && (
            <>
              {pushStatus === "denied" && (
                <p className="text-xs text-red-300 mb-2">
                  Uitgeschakeld. Zet &apos;m aan via de instellingen-app van je telefoon (Swyp → Meldingen).
                </p>
              )}
              <Button size="sm" onClick={handleEnablePush}>
                Pushmeldingen aanzetten
              </Button>
            </>
          )}
        </Card>

        <Card className="p-4 mb-4">
          <p className="text-sm font-bold mb-0.5">Knoppen in de feed</p>
          <p className="text-xs text-white/50 mb-3">Kies hoe de knoppen rechts naast een video eruitzien.</p>
          <div className="grid grid-cols-2 gap-3">
            {(["a", "b"] as const).map((kind) => (
              <button
                key={kind}
                onClick={() => setFeedStyle(kind)}
                aria-pressed={feedStyle === kind}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold ${
                  feedStyle === kind ? "border-violet bg-violet/15" : "border-white/10 bg-white/[0.03] text-white/60"
                }`}
              >
                <StylePreview kind={kind} />
                {kind === "a" ? "Klassiek: losse knoppen" : "Nieuw: glazen kapsel"}
              </button>
            ))}
          </div>
        </Card>

        <Link href="/app/feedback?from=instellingen">
          <Card className="p-4 mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5">
              <MessageSquare size={18} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Feedback geven</p>
              <p className="text-xs text-white/50">Meld een fout of deel een idee</p>
            </div>
          </Card>
        </Link>

        <DeleteAccount kind="consumer" />
      </div>
    </div>
  );
}
