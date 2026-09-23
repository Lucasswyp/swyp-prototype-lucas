"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useConsumerAuth } from "@/contexts/ConsumerAuthContext";
import { signInWithGoogle } from "@/lib/googleAuth";
import { signInWithApple } from "@/lib/appleAuth";
import { LogoMark } from "@/components/ui/Logo";

export function LoginPromptModal() {
  const { promptOpen, closePrompt } = useConsumerAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [signingInApple, setSigningInApple] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => setIsNative(Capacitor.isNativePlatform()));
  }, []);

  async function handleGoogle() {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      // Only reached if signInWithGoogle returned without navigating away
      // (e.g. the OAuth call itself failed) — a successful native flow
      // navigates off this screen before this would ever run.
      setSigningIn(false);
    }
  }

  async function handleApple() {
    if (signingInApple) return;
    setSigningInApple(true);
    try {
      await signInWithApple();
      closePrompt();
    } catch {
      setSigningInApple(false);
    }
  }

  return (
    <AnimatePresence>
      {promptOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
          onClick={closePrompt}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-slate p-6 pb-7 text-center"
          >
            <button
              onClick={closePrompt}
              aria-label="Sluiten"
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet to-magenta">
              <LogoMark size={26} />
            </div>
            <h2 className="font-heading text-lg font-bold mb-1.5">Welkom bij Swyp</h2>
            <p className="text-sm text-white/50 mb-5">
              Log in om Swyp Tokens te verdienen, producten op te slaan en rewards in te wisselen. Je kunt ook
              gewoon blijven kijken.
            </p>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={signingIn}
              className="w-full mb-2.5 flex items-center justify-center gap-2 rounded-xl bg-white text-indigo font-semibold text-sm py-3 hover:brightness-95 disabled:opacity-60"
            >
              {signingIn ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C33.9 5.4 29.2 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13.5 24 13.5c3.1 0 5.8 1.1 8 3l6-6C33.9 6.4 29.2 4.5 24 4.5c-7.5 0-14 4.1-17.7 10.2z" />
                  <path fill="#4CAF50" d="M24 44.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.8 40.3 16.4 44.5 24 44.5z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.1c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.4-.3-3.5z" />
                </svg>
              )}
              Doorgaan met Google
            </button>
            {isNative && (
              <button
                type="button"
                onClick={handleApple}
                disabled={signingInApple}
                className="w-full mb-2.5 flex items-center justify-center gap-2 rounded-xl bg-black border border-white/15 text-white font-semibold text-sm py-3 hover:brightness-125 disabled:opacity-60"
              >
                {signingInApple ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                  </svg>
                )}
                Doorgaan met Apple
              </button>
            )}
            <Link href="/get-started/user" className="block">
              <button className="w-full mb-1 rounded-xl border border-white/15 bg-white/5 text-white font-semibold text-sm py-3 hover:bg-white/10">
                Doorgaan met e-mail
              </button>
            </Link>
            <button onClick={closePrompt} className="text-sm text-white/40 py-3">
              Later, ik wil eerst kijken
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
