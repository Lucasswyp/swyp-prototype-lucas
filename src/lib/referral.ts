import { createClient } from "@/lib/supabase/client";

const PENDING_REFERRAL_KEY = "swyp-pending-referral";

// Called on every page load (see ReferralCapture, mounted in the root
// layout) so a shared link works no matter which page it lands on — the
// marketing homepage, /get-started, or straight to /get-started/user.
export function capturePendingReferralFromUrl() {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("ref");
  if (code) window.localStorage.setItem(PENDING_REFERRAL_KEY, code);
}

export interface ApplyReferralResult {
  awarded: boolean;
  reason?: string;
  points?: number;
  balance?: number;
}

// Called once right after login (see ConsumerAuthContext) — reads whatever
// code capturePendingReferralFromUrl() stashed, applies it server-side, and
// clears it either way so a stale/already-used code never gets retried on
// every future login.
export async function consumePendingReferral(): Promise<ApplyReferralResult | null> {
  if (typeof window === "undefined") return null;
  const code = window.localStorage.getItem(PENDING_REFERRAL_KEY);
  if (!code) return null;
  window.localStorage.removeItem(PENDING_REFERRAL_KEY);
  const supabase = createClient();
  const { data, error } = await supabase.rpc("apply_referral", { p_code: code });
  if (error) return null;
  return data as ApplyReferralResult;
}

export interface ReferralStats {
  referralCode: string | null;
  referredCount: number;
}

export async function fetchReferralStats(): Promise<ReferralStats> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_referral_stats");
  if (error) throw error;
  return data as ReferralStats;
}

export function referralLink(code: string) {
  return `https://swyp.it/get-started/user?ref=${code}`;
}
