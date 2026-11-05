"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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
  /** Vraagt een gast (hooguit één keer per sessie) om in te loggen, nadat die iets gezien heeft. */
  nudgeLogin: () => void;
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
  // De nieuwste stand, voor de uitgestelde vraag om in te loggen (die loopt buiten een render om).
  const guestRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setIsLoggedIn(!!data.user);
      guestRef.current = !data.user;
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
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
      guestRef.current = !session?.user;
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

  // Niet meteen bij het openen: eerst een paar video's zien, dan pas de vraag om in te loggen.
  function nudgeLogin() {
    if (!guestRef.current) return;
    try {
      if (sessionStorage.getItem("swyp_entry_prompt_shown")) return;
      sessionStorage.setItem("swyp_entry_prompt_shown", "1");
    } catch {}
    setPromptOpen(true);
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
        nudgeLogin,
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
