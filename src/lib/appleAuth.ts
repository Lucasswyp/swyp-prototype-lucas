import { createClient } from "@/lib/supabase/client";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Native-only: Apple requires an equivalent to any other social login it
// offers (App Store Guideline 4.8), which is why this exists alongside
// signInWithGoogle. Unlike Google, this doesn't need the system-browser +
// custom-scheme redirect dance — AuthenticationServices hands back a signed
// identity token directly, which Supabase verifies against the bundle ID
// (Supabase dashboard's "Apple" provider, Client IDs = it.swyp.app).
//
// The nonce has to travel through this flow in two different forms: Apple's
// native request wants the SHA-256 hash (it embeds that hash verbatim into
// the identity token's `nonce` claim, it does not hash it again), while
// Supabase's signInWithIdToken wants the original raw value so *it* can hash
// and compare. Passing the same string to both ends up mismatched and the
// sign-in silently fails token verification.
export async function signInWithApple() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;

  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
  const rawNonce = crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);

  const result = await SignInWithApple.authorize({
    clientId: "it.swyp.app",
    redirectURI: "it.swyp.app://auth/confirm",
    scopes: "email name",
    nonce: hashedNonce,
  });

  const identityToken = result.response.identityToken;
  if (!identityToken) throw new Error("Apple gaf geen identity token terug.");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
}
