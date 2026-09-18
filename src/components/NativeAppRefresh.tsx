"use client";

import { useEffect } from "react";

// Capacitor loads this app from a remote URL into a long-lived WebView. On a
// normal website every open is a fresh network request, but resuming a
// backgrounded native app just shows whatever was already in memory — so a
// deployed fix never appears until the OS kills the process. Reloading on
// every resume keeps the native shell as fresh as opening the site directly.
export function NativeAppRefresh() {
  useEffect(() => {
    let capApp: typeof import("@capacitor/app").App | undefined;
    let listenerHandle: { remove: () => void } | undefined;

    import("@capacitor/core").then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      capApp = App;
      const listener = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) window.location.reload();
      });
      listenerHandle = listener;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  return null;
}
