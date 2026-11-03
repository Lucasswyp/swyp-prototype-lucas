"use client";

import { useEffect } from "react";
import { OAUTH_PENDING_KEY } from "@/lib/googleAuth";
import { APP_RESUME_REFRESH_MS } from "@/lib/appVisibility";

// Capacitor loads this app from a remote URL into a long-lived WebView. Resuming a backgrounded
// native app just shows whatever was already in memory, so a deployed fix would never appear.
// Korte afwezigheid (tot een halfuur): alles blijft precies zoals je het achterliet, zoals bij elke
// andere app. Langer weg: terug naar /app, helemaal vers, met de nieuwste versie en video's.
export function NativeAppRefresh() {
  useEffect(() => {
    let listenerHandle: { remove: () => void } | undefined;
    let hiddenAt: number | null = null;

    import("@capacitor/core").then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive) {
          hiddenAt = Date.now();
          return;
        }
        const away = hiddenAt ? Date.now() - hiddenAt : 0;
        hiddenAt = null;
        // Presenting the system browser for Google sign-in (see
        // src/lib/googleAuth.ts) also fires this resume event once the user
        // finishes there — forcing /app here would race NativeOAuthListener's
        // own navigation and could clobber the in-flight code exchange.
        if (away >= APP_RESUME_REFRESH_MS && !window.sessionStorage.getItem(OAUTH_PENDING_KEY)) {
          window.location.href = "/app";
        }
      });
      listenerHandle = listener;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  return null;
}
