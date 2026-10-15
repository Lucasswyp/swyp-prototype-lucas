"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { TopBar } from "@/components/consumer/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteAccount } from "@/components/DeleteAccount";

type PushStatus = "not-native" | "checking" | "granted" | "denied" | "prompt" | "prompt-with-rationale";

export default function SettingsPage() {
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

        <DeleteAccount kind="consumer" />
      </div>
    </div>
  );
}
