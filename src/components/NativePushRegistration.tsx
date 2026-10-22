"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Registers this device for APNs push (streak reminders, etc. — see
// src/app/api/cron/streak-reminder) the moment a session exists. Lives in
// the root layout like NativeAppRefresh/NativeOAuthListener, outside
// ConsumerAuthProvider's tree, so it tracks login state itself via
// onAuthStateChange rather than useConsumerAuth().
export function NativePushRegistration() {
  useEffect(() => {
    let cancelled = false;
    let removeListeners: (() => void) | undefined;

    import("@capacitor/core").then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform() || cancelled) return;
      const { PushNotifications } = await import("@capacitor/push-notifications");

      const regListener = await PushNotifications.addListener("registration", async (token) => {
        try {
          await fetch("/api/push/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token.value }),
          });
        } catch {
          // Best-effort — a failed registration just means this device
          // misses reminders until the next successful one (e.g. next launch).
        }
      });
      const errorListener = await PushNotifications.addListener("registrationError", () => {});
      // Tik op een melding: open de pagina uit de melding (bijvoorbeeld het
      // gesprek). Alleen paden binnen de app (en het beheerscherm voor meldingen), nooit een extern adres.
      const tapListener = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        const url = action.notification?.data?.url;
        if (typeof url === "string" && /^\/(app(\/|$)|admin\/reports$)/.test(url)) window.location.href = url;
      });
      removeListeners = () => {
        regListener.remove();
        errorListener.remove();
        tapListener.remove();
      };

      async function registerIfLoggedIn() {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user || cancelled) return;
        const perm = await PushNotifications.checkPermissions();
        const granted =
          perm.receive === "granted" ? true : (await PushNotifications.requestPermissions()).receive === "granted";
        if (!granted || cancelled) return;
        await PushNotifications.register();
      }

      registerIfLoggedIn();
      const supabase = createClient();
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") registerIfLoggedIn();
      });
      const unsubscribe = () => sub.subscription.unsubscribe();
      const prevRemove = removeListeners;
      removeListeners = () => {
        prevRemove?.();
        unsubscribe();
      };
    });

    return () => {
      cancelled = true;
      removeListeners?.();
    };
  }, []);

  return null;
}
