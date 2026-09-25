"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import { consumePendingReferral } from "@/lib/referral";

interface ConsumerAuthValue {
  isLoggedIn: boolean;
  loading: boolean;
  promptOpen: boolean;
  profileIncomplete: boolean;
  markProfileComplete: () => void;
  requireAuth: () => boolean;
  closePrompt: () => void;
  referralAward: number | null;
  dismissReferralAward: () => void;
}

const ConsumerAuthContext = createContext<ConsumerAuthValue | null>(null);

export function ConsumerAuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promptOpen, setPromptOpen] = useState(false);
  // Google sign-ins skip the username/photo step email signup collects
  // up front, so consumers.profile_completed starts false for them — this
  // drives a one-time redirect to /app/complete-profile (see AppLayout).
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [referralAward, setReferralAward] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setIsLoggedIn(!!data.user);
      if (data.user) {
        posthog.identify(data.user.id, { email: data.user.email });
        const { data: consumer } = await supabase
          .from("consumers")
          .select("profile_completed")
          .maybeSingle();
        setProfileIncomplete(consumer ? !consumer.profile_completed : false);
        // Only meaningful once a session exists — apply_referral resolves
        // the referrer from auth.uid() server-side (see referrals.sql).
        const referral = await consumePendingReferral();
        if (referral?.awarded && referral.points) setReferralAward(referral.points);
      }
      setLoading(false);
      // Show the login/signup sheet once per session for guests, a beat
      // after the feed itself has loaded — never block the first video.
      if (!data.user && !sessionStorage.getItem("swyp_entry_prompt_shown")) {
        sessionStorage.setItem("swyp_entry_prompt_shown", "1");
        window.setTimeout(() => setPromptOpen(true), 1200);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      }
      if (event === "SIGNED_OUT") {
        posthog.reset();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function requireAuth() {
    if (isLoggedIn) return true;
    setPromptOpen(true);
    return false;
  }

  return (
    <ConsumerAuthContext.Provider
      value={{
        isLoggedIn,
        loading,
        promptOpen,
        profileIncomplete,
        markProfileComplete: () => setProfileIncomplete(false),
        requireAuth,
        closePrompt: () => setPromptOpen(false),
        referralAward,
        dismissReferralAward: () => setReferralAward(null),
      }}
    >
      {children}
    </ConsumerAuthContext.Provider>
  );
}

export function useConsumerAuth() {
  const ctx = useContext(ConsumerAuthContext);
  if (!ctx) throw new Error("useConsumerAuth must be used within ConsumerAuthProvider");
  return ctx;
}
