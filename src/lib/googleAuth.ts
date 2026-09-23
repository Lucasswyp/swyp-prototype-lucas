import { createClient } from "@/lib/supabase/client";

// Sessionstorage flag so NativeAppRefresh's forced navigate-to-/app on every
// app resume (see src/components/NativeAppRefresh.tsx) doesn't race the
// deep-link handler in NativeOAuthListener while the system browser is up —
// that resume fires the moment the OS hands control back to the app, which
// can be before the OAuth code has been exchanged for a session.
export const OAUTH_PENDING_KEY = "swyp-oauth-pending";

// Inside Capacitor's embedded WKWebView, Google's own policy rejects the
// OAuth consent screen outright ("This browser or app may not be secure" /
// disallowed_useragent) — it refuses to render for any in-app WebView.
// Google does trust the system browser Capacitor's Browser plugin opens
// (SFSafariViewController/ASWebAuthenticationSession on iOS), so on native we
// fetch the provider URL ourselves (skipBrowserRedirect) and hand it to that
// instead of letting supabase-js navigate the WebView directly. The redirect
// target is a custom URL scheme (registered in Info.plist) that hands control
// back to the app; NativeOAuthListener finishes the sign-in from there.
export async function signInWithGoogle() {
  const supabase = createClient();
  const { Capacitor } = await import("@capacitor/core");

  if (!Capacitor.isNativePlatform()) {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "it.swyp.app://auth/confirm",
      skipBrowserRedirect: true,
    },
  });
  if (error || !data?.url) return;

  window.sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url: data.url });
}
