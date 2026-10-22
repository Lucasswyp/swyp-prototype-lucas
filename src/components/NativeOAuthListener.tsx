"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { OAUTH_PENDING_KEY } from "@/lib/googleAuth";

// Counterpart to signInWithGoogle() in src/lib/googleAuth.ts: that function
// hands the Google consent URL to the system browser (Capacitor's Browser
// plugin) instead of navigating the embedded WebView, since Google refuses to
// render its OAuth screen inside a WKWebView. Once the user finishes there,
// Google/Supabase redirect to our custom `it.swyp.app://auth/confirm` URL
// scheme (registered in Info.plist), which the OS delivers here as an
// `appUrlOpen` event rather than a page load — so, unlike the web flow, the
// code exchange has to happen on the client instead of the /auth/confirm
// route handler.
export function NativeOAuthListener() {
  useEffect(() => {
    let listenerHandle: { remove: () => void } | undefined;

    import("@capacitor/core").then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      const [{ App }, { Browser }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
      ]);

      const listener = await App.addListener("appUrlOpen", async ({ url }) => {
        // Universele link (https://swyp.it/app/...): open dezelfde pagina in de app.
        // Alleen /app-paden; alles anders laten we met rust.
        if (url.startsWith("https://swyp.it/")) {
          const target = new URL(url);
          if (target.pathname === "/app" || target.pathname.startsWith("/app/")) {
            window.location.href = `${target.pathname}${target.search}`;
          }
          return;
        }
        if (!url.startsWith("it.swyp.app://auth/confirm")) return;

        await Browser.close().catch(() => {});
        const params = new URL(url).searchParams;
        const code = params.get("code");
        const oauthError = params.get("error_description") ?? params.get("error");
        window.sessionStorage.removeItem(OAUTH_PENDING_KEY);

        if (oauthError) {
          window.location.href = `/get-started/user?authError=${encodeURIComponent(oauthError)}`;
          return;
        }
        if (code) {
          const supabase = createClient();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            window.location.href = `/get-started/user?authError=${encodeURIComponent(error.message)}`;
            return;
          }
        }
        // Full navigation, not a router push — the session was just written
        // via a client the current page's server components never saw.
        window.location.href = "/app";
      });
      listenerHandle = listener;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, []);

  return null;
}
