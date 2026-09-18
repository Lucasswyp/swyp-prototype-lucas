"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface ConsumerAuthValue {
  isLoggedIn: boolean;
  loading: boolean;
  promptOpen: boolean;
  requireAuth: () => boolean;
  closePrompt: () => void;
}

const ConsumerAuthContext = createContext<ConsumerAuthValue | null>(null);

export function ConsumerAuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
      setLoading(false);
      // Show the login/signup sheet once per session for guests, a beat
      // after the feed itself has loaded — never block the first video.
      if (!data.user && !sessionStorage.getItem("swyp_entry_prompt_shown")) {
        sessionStorage.setItem("swyp_entry_prompt_shown", "1");
        window.setTimeout(() => setPromptOpen(true), 1200);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
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
      value={{ isLoggedIn, loading, promptOpen, requireAuth, closePrompt: () => setPromptOpen(false) }}
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
