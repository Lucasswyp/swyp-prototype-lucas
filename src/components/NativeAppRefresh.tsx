"use client";

import { useEffect } from "react";
import { OAUTH_PENDING_KEY } from "@/lib/googleAuth";

// Capacitor loads this app from a remote URL into a long-lived WebView. On a
// normal website every open is a fresh network request, but resuming a
// backgrounded native app just shows whatever was already in memory — so a
// deployed fix never appears until the OS kills the process, and the app
// resumes wherever the user last scrolled to instead of the feed. Both are
// wrong for a TikTok-style app: reopening should always mean the For You
// feed, fully fresh. Navigating (not just reloading) back to /app on every
// resume gets both at once.
export function NativeAppRefresh() {
  useEffect(() => {
    let listenerHandle: { remove: () => void } | undefined;

    import("@capacitor/core").then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("appStateChange", ({ isActive }) => {
        // Presenting the system browser for Google sign-in (see
        // src/lib/googleAuth.ts) also fires this resume event once the user
        // finishes there — forcing /app here would race NativeOAuthListener's
        // own navigation and could clobber the in-flight code exchange.
        if (isActive && !window.sessionStorage.getItem(OAUTH_PENDING_KEY)) {
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
